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
  progress: number;
  output?: Output;
  payload?: IDesign;
  displayProgressModal: boolean;
  statusMessage: string;
  actions: {
    setProjectId: (projectId: string) => void;
    setExporting: (exporting: boolean) => void;
    setExportType: (exportType: "json" | "mp4") => void;
    setProgress: (progress: number) => void;
    setState: (state: Partial<DownloadState>) => void;
    setOutput: (output: Output) => void;
    startExport: () => void;
    setDisplayProgressModal: (displayProgressModal: boolean) => void;
  };
}

export const useDownloadState = create<DownloadState>((set, get) => ({
  projectId: "",
  exporting: false,
  exportType: "mp4",
  progress: 0,
  displayProgressModal: false,
  statusMessage: "",
  actions: {
    setProjectId: (projectId) => set({ projectId }),
    setExporting: (exporting) => set({ exporting }),
    setExportType: (exportType) => set({ exportType }),
    setProgress: (progress) => set({ progress }),
    setState: (state) => set({ ...state }),
    setOutput: (output) => set({ output }),
    setDisplayProgressModal: (displayProgressModal) =>
      set({ displayProgressModal }),
    startExport: async () => {
      try {
        set({ exporting: true, displayProgressModal: true, progress: 0, statusMessage: "Preparing..." });

        const { payload, exportType } = get();
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
        set({ progress: 10, statusMessage: "Extracting video info..." });

        const edl = createEditDecisionList(payload);

        // Find the source video blob URL
        const videoSegments = edl.segments.filter(s => s.type === "video");
        if (videoSegments.length === 0) {
          throw new Error("No video segments found in timeline");
        }

        const sourceUrl = videoSegments[0].sourceUrl;

        // Check if it's a blob URL (local file)
        if (sourceUrl.startsWith("blob:")) {
          set({ progress: 20, statusMessage: "Fetching video from memory..." });

          // Fetch the blob from the blob URL
          const response = await fetch(sourceUrl);
          const videoBlob = await response.blob();

          set({ progress: 40, statusMessage: "Uploading to render server..." });

          // Create FormData with video and edit instructions
          const formData = new FormData();
          formData.append("file", videoBlob, "video.mp4");
          formData.append("edits", JSON.stringify({
            segments: edl.segments.map(s => ({
              startTime: (s.trimFrom || 0) / 1000,
              endTime: (s.trimTo || s.duration) / 1000,
              speed: s.speed
            })),
            settings: {
              outputFormat: "mp4",
              removeAudio: false
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

        } else {
          // For remote URLs, just create the EDL JSON for now
          set({ statusMessage: "Remote URLs require download first. Creating EDL..." });
          const edlJson = JSON.stringify(edl, null, 2);
          const blob = new Blob([edlJson], { type: "application/json" });
          const url = URL.createObjectURL(blob);

          set({
            progress: 100,
            exporting: false,
            statusMessage: "EDL created (download video first for MP4).",
            output: { url, type: "json", blob }
          });
        }

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
function createEditDecisionList(design: IDesign) {
  const trackItemsMap = design.trackItemsMap || {};

  const segments: Array<{
    id: string;
    type: string;
    startTime: number;
    endTime: number;
    duration: number;
    speed: number;
    sourceUrl: string;
    trimFrom?: number;
    trimTo?: number;
  }> = [];

  for (const [id, item] of Object.entries(trackItemsMap as Record<string, any>)) {
    if (item.type === "video") {
      segments.push({
        id,
        type: "video",
        startTime: item.display?.from || 0,
        endTime: item.display?.to || 0,
        duration: (item.display?.to || 0) - (item.display?.from || 0),
        speed: item.playbackRate || 1,
        sourceUrl: item.details?.src || "",
        trimFrom: item.trim?.from,
        trimTo: item.trim?.to
      });
    }
  }

  segments.sort((a, b) => a.startTime - b.startTime);

  return {
    version: "1.0",
    projectId: design.id,
    exportedAt: new Date().toISOString(),
    size: design.size,
    duration: design.duration,
    fps: 30,
    segments
  };
}
