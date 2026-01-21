import { IDesign } from "@designcombo/types";
import { create } from "zustand";

// HF Space backend URL - update this to your deployed URL
const HF_SPACE_URL = process.env.NEXT_PUBLIC_HF_SPACE_URL || "https://karansinghrathore820-myvirtualmachine.hf.space";

interface Output {
  url: string;
  type: string;
  blob?: Blob;
}

interface DownloadState {
  projectId: string;
  exporting: boolean;
  exportType: "json" | "mp4";
  exportQuality: "720p" | "1080p" | "4k";
  progress: number;
  output?: Output;
  payload?: IDesign;
  displayProgressModal: boolean;
  statusMessage: string;
  actions: {
    setProjectId: (projectId: string) => void;
    setExporting: (exporting: boolean) => void;
    setExportType: (exportType: "json" | "mp4") => void;
    setExportQuality: (quality: "720p" | "1080p" | "4k") => void;
    setProgress: (progress: number) => void;
    setState: (state: Partial<DownloadState>) => void;
    setOutput: (output: Output) => void;
    startExport: () => void;
    setDisplayProgressModal: (displayProgressModal: boolean) => void;
  };
}

// Quality presets
const QUALITY_PRESETS = {
  "720p": { width: 1280, height: 720, bitrate: "3M", crf: 23 },
  "1080p": { width: 1920, height: 1080, bitrate: "8M", crf: 20 },
  "4k": { width: 3840, height: 2160, bitrate: "25M", crf: 18 }
};

export const useDownloadState = create<DownloadState>((set, get) => ({
  projectId: "",
  exporting: false,
  exportType: "mp4",
  exportQuality: "1080p",
  progress: 0,
  displayProgressModal: false,
  statusMessage: "",
  actions: {
    setProjectId: (projectId) => set({ projectId }),
    setExporting: (exporting) => set({ exporting }),
    setExportType: (exportType) => set({ exportType }),
    setExportQuality: (quality) => set({ exportQuality: quality }),
    setProgress: (progress) => set({ progress }),
    setState: (state) => set({ ...state }),
    setOutput: (output) => set({ output }),
    setDisplayProgressModal: (displayProgressModal) =>
      set({ displayProgressModal }),
    startExport: async () => {
      try {
        set({ exporting: true, displayProgressModal: true, progress: 0, statusMessage: "Preparing..." });

        const { payload, exportType, exportQuality } = get();
        if (!payload) throw new Error("Payload is not defined");

        // For JSON export, just create a downloadable JSON file
        if (exportType === "json") {
          set({ progress: 50, statusMessage: "Creating JSON..." });
          const jsonStr = JSON.stringify(payload, null, 2);
          const blob = new Blob([jsonStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);

          set({
            progress: 100,
            exporting: false,
            statusMessage: "Ready!",
            output: { url, type: "json", blob }
          });
          return;
        }

        // For MP4 export, render using FFmpeg backend
        set({ progress: 5, statusMessage: "Extracting timeline data..." });

        const edl = createEditDecisionList(payload, exportQuality);

        // Collect all media (videos and audios)
        const allMedia = [...edl.videoSegments, ...edl.audioSegments];

        if (allMedia.length === 0) {
          throw new Error("No media found in timeline");
        }

        set({ progress: 10, statusMessage: "Downloading media files..." });

        // Download all media files (both blob and remote URLs)
        const mediaBlobs: { [key: string]: Blob } = {};
        let downloadedCount = 0;

        for (const segment of allMedia) {
          try {
            set({
              progress: 10 + Math.floor((downloadedCount / allMedia.length) * 30),
              statusMessage: `Downloading ${segment.type}: ${segment.name || segment.id}...`
            });

            let blob: Blob | null = null;
            const url = segment.sourceUrl;

            // Check if it's a blob URL or external URL
            if (url.startsWith("blob:")) {
              // Blob URLs can be fetched directly
              const response = await fetch(url);
              if (response.ok) {
                blob = await response.blob();
              }
            } else if (url.startsWith("http://") || url.startsWith("https://")) {
              // External URLs need to go through proxy to avoid CORS issues
              console.log(`Using proxy for external URL: ${url}`);
              const proxyResponse = await fetch("/api/media-proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url })
              });
              if (proxyResponse.ok) {
                blob = await proxyResponse.blob();
              } else {
                console.warn(`Proxy failed for ${url}: ${proxyResponse.status}`);
              }
            }

            if (blob) {
              mediaBlobs[segment.id] = blob;
              console.log(`Downloaded ${segment.id}: ${blob.size} bytes`);
            } else {
              console.warn(`Failed to download: ${url}`);
            }
          } catch (err) {
            console.warn(`Error downloading ${segment.id}:`, err);
          }
          downloadedCount++;
        }

        if (Object.keys(mediaBlobs).length === 0) {
          throw new Error("Could not download any media files");
        }

        set({ progress: 40, statusMessage: "Uploading to render server..." });

        // Create FormData with all media files and edit instructions
        const formData = new FormData();

        // Add each media file
        for (const [id, blob] of Object.entries(mediaBlobs)) {
          const segment = allMedia.find(s => s.id === id);
          const extension = segment?.type === "audio" ? "mp3" : "mp4";
          formData.append("files", blob, `${id}.${extension}`);
        }

        // Add edit instructions with quality settings
        formData.append("edits", JSON.stringify({
          videoSegments: edl.videoSegments.map(s => ({
            id: s.id,
            filename: `${s.id}.mp4`,
            startTime: s.startTime / 1000,
            endTime: s.endTime / 1000,
            trimFrom: (s.trimFrom || 0) / 1000,
            trimTo: (s.trimTo || s.duration) / 1000,
            speed: s.speed,
            volume: s.volume,
            opacity: s.opacity
          })),
          audioSegments: edl.audioSegments.map(s => ({
            id: s.id,
            filename: `${s.id}.mp3`,
            startTime: s.startTime / 1000,
            endTime: s.endTime / 1000,
            trimFrom: (s.trimFrom || 0) / 1000,
            trimTo: (s.trimTo || s.duration) / 1000,
            volume: s.volume
          })),
          settings: {
            outputFormat: "mp4",
            width: QUALITY_PRESETS[exportQuality].width,
            height: QUALITY_PRESETS[exportQuality].height,
            bitrate: QUALITY_PRESETS[exportQuality].bitrate,
            crf: QUALITY_PRESETS[exportQuality].crf,
            fps: edl.fps || 30,
            codec: "libx264",
            audioCodec: "aac",
            audioBitrate: "192k"
          }
        }));

        set({ progress: 50, statusMessage: "Rendering with FFmpeg..." });

        // Send to HF Space for rendering
        const renderResponse = await fetch(`${HF_SPACE_URL}/api/video/render`, {
          method: "POST",
          body: formData
        });

        if (!renderResponse.ok) {
          const errorText = await renderResponse.text();
          console.error("Render error:", errorText);
          throw new Error(`Render failed: ${errorText}`);
        }

        set({ progress: 90, statusMessage: "Downloading rendered video..." });

        // Get the rendered video
        const renderedBlob = await renderResponse.blob();
        const url = URL.createObjectURL(renderedBlob);

        set({
          progress: 100,
          exporting: false,
          statusMessage: "Complete!",
          output: { url, type: "mp4", blob: renderedBlob }
        });

      } catch (error) {
        console.error("Export error:", error);
        set({
          exporting: false,
          progress: 0,
          statusMessage: `Error: ${(error as Error).message}`
        });
      }
    }
  }
}));

/**
 * Create an Edit Decision List from the design payload
 */
function createEditDecisionList(design: IDesign, quality: string) {
  const trackItemsMap = design.trackItemsMap || {};

  interface MediaSegment {
    id: string;
    type: string;
    name?: string;
    startTime: number;
    endTime: number;
    duration: number;
    speed: number;
    volume: number;
    opacity?: number;
    sourceUrl: string;
    trimFrom?: number;
    trimTo?: number;
  }

  const videoSegments: MediaSegment[] = [];
  const audioSegments: MediaSegment[] = [];

  for (const [id, item] of Object.entries(trackItemsMap as Record<string, any>)) {
    const baseSegment = {
      id,
      name: item.name || id,
      startTime: item.display?.from || 0,
      endTime: item.display?.to || 0,
      duration: (item.display?.to || 0) - (item.display?.from || 0),
      speed: item.playbackRate || 1,
      volume: item.details?.volume ?? 100,
      sourceUrl: item.details?.src || "",
      trimFrom: item.trim?.from,
      trimTo: item.trim?.to
    };

    if (item.type === "video") {
      videoSegments.push({
        ...baseSegment,
        type: "video",
        opacity: item.details?.opacity ?? 100
      });
    } else if (item.type === "audio") {
      audioSegments.push({
        ...baseSegment,
        type: "audio"
      });
    }
  }

  // Sort by start time
  videoSegments.sort((a, b) => a.startTime - b.startTime);
  audioSegments.sort((a, b) => a.startTime - b.startTime);

  return {
    version: "2.0",
    projectId: design.id,
    exportedAt: new Date().toISOString(),
    size: design.size,
    duration: design.duration,
    fps: design.fps || 30,
    quality,
    videoSegments,
    audioSegments
  };
}
