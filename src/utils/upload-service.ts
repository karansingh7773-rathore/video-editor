/**
 * Upload Service - Modified for Local Mode
 * 
 * In local mode, files are stored as blob URLs in browser memory
 * instead of being uploaded to cloud storage.
 */

export type UploadProgressCallback = (
  uploadId: string,
  progress: number
) => void;

export type UploadStatusCallback = (
  uploadId: string,
  status: "uploaded" | "failed",
  error?: string
) => void;

export interface UploadCallbacks {
  onProgress: UploadProgressCallback;
  onStatus: UploadStatusCallback;
}

/**
 * Process file upload - Local mode
 * Creates a blob URL for the file instead of uploading to cloud
 */
export async function processFileUpload(
  uploadId: string,
  file: File,
  callbacks: UploadCallbacks
): Promise<any> {
  try {
    // Simulate progress
    callbacks.onProgress(uploadId, 10);

    // Create a blob URL for the file (stays in browser memory)
    const blobUrl = URL.createObjectURL(file);

    callbacks.onProgress(uploadId, 50);

    // Determine file type
    const fileType = file.type.split("/")[0]; // 'video', 'image', 'audio'

    // Get file dimensions for images/videos
    let width = 0;
    let height = 0;
    let duration = 0;

    if (fileType === "video") {
      const videoDimensions = await getVideoDimensions(blobUrl);
      width = videoDimensions.width;
      height = videoDimensions.height;
      duration = videoDimensions.duration;
    } else if (fileType === "image") {
      const imageDimensions = await getImageDimensions(blobUrl);
      width = imageDimensions.width;
      height = imageDimensions.height;
    }

    callbacks.onProgress(uploadId, 90);

    // Construct upload data
    const uploadData = {
      fileName: file.name,
      filePath: blobUrl, // Use blob URL as the path
      fileSize: file.size,
      contentType: file.type,
      metadata: {
        uploadedUrl: blobUrl,
        width,
        height,
        duration
      },
      folder: `local-${Date.now()}`,
      type: fileType,
      method: "local",
      origin: "user",
      status: "uploaded",
      isPreview: false,
      // These are used by the timeline
      src: blobUrl,
      url: blobUrl,
      width,
      height,
      duration
    };

    callbacks.onProgress(uploadId, 100);
    callbacks.onStatus(uploadId, "uploaded");
    return uploadData;
  } catch (error) {
    callbacks.onStatus(uploadId, "failed", (error as Error).message);
    throw error;
  }
}

/**
 * Get video dimensions and duration
 * NOTE: Do NOT revoke the blob URL here - it's needed for playback
 */
function getVideoDimensions(url: string): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true; // Prevent autoplay issues

    const timeoutId = setTimeout(() => {
      // Fallback if metadata doesn't load in 5 seconds
      resolve({ width: 1920, height: 1080, duration: 5000 });
    }, 5000);

    video.onloadedmetadata = () => {
      clearTimeout(timeoutId);
      resolve({
        width: video.videoWidth || 1920,
        height: video.videoHeight || 1080,
        duration: (video.duration || 5) * 1000 // Convert to milliseconds
      });
      // Do NOT revoke URL here - the blob URL is needed for the timeline player
    };
    video.onerror = () => {
      clearTimeout(timeoutId);
      console.warn("Could not load video metadata, using defaults");
      resolve({ width: 1920, height: 1080, duration: 5000 });
    };
    video.src = url;
  });
}


/**
 * Get image dimensions
 */
function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = () => {
      resolve({ width: 1920, height: 1080 }); // Default fallback
    };
    img.src = url;
  });
}

/**
 * Process URL upload - Local mode
 * Just returns the URL directly for use in the editor
 */
export async function processUrlUpload(
  uploadId: string,
  url: string,
  callbacks: UploadCallbacks
): Promise<any[]> {
  try {
    callbacks.onProgress(uploadId, 10);

    // Determine content type from URL
    const ext = url.split('.').pop()?.toLowerCase() || '';
    const contentTypes: Record<string, string> = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mov': 'video/quicktime',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav'
    };
    const contentType = contentTypes[ext] || 'video/mp4';
    const fileType = contentType.split('/')[0];

    callbacks.onProgress(uploadId, 50);

    const fileName = url.split('/').pop() || `media-${Date.now()}`;

    const uploadData = {
      fileName,
      filePath: url,
      fileSize: 0,
      contentType,
      metadata: { originalUrl: url },
      folder: `url-import-${Date.now()}`,
      type: fileType,
      method: "url",
      origin: "user",
      status: "uploaded",
      isPreview: false,
      src: url,
      url: url
    };

    callbacks.onProgress(uploadId, 100);
    callbacks.onStatus(uploadId, "uploaded");
    return [uploadData];
  } catch (error) {
    callbacks.onStatus(uploadId, "failed", (error as Error).message);
    throw error;
  }
}

export async function processUpload(
  uploadId: string,
  upload: { file?: File; url?: string },
  callbacks: UploadCallbacks
): Promise<any> {
  if (upload.file) {
    return await processFileUpload(uploadId, upload.file, callbacks);
  }
  if (upload.url) {
    return await processUrlUpload(uploadId, upload.url, callbacks);
  }
  callbacks.onStatus(uploadId, "failed", "No file or URL provided");
  throw new Error("No file or URL provided");
}
