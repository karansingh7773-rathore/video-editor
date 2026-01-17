import { NextRequest, NextResponse } from "next/server";

interface PresignRequest {
  userId: string;
  fileNames: string[];
}

/**
 * This route handles presigned URL generation for video uploads.
 * Since we're using a local/HF Space backend, we'll return fake presigned URLs
 * that point to a local upload endpoint or use direct browser-to-HF upload.
 * 
 * For the basic version, videos are kept in browser memory
 * and sent directly to the render endpoint when exporting.
 */
export async function POST(request: NextRequest) {
  try {
    const body: PresignRequest = await request.json();
    const { userId, fileNames } = body;

    if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
      return NextResponse.json(
        { error: "fileNames array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Generate local URLs for each file
    // In the basic version, files are stored in browser memory (blob URLs)
    // and uploaded directly to HF Space on export
    const uploads = fileNames.map((fileName, index) => {
      const fileId = `local-${Date.now()}-${index}`;

      return {
        fileName,
        filePath: `/uploads/${fileId}/${fileName}`,
        contentType: getContentType(fileName),
        // For local mode, we don't need a real presigned URL
        // The file will be kept as a blob URL in the browser
        presignedUrl: `blob:${fileName}`,
        folder: fileId,
        url: `blob:${fileName}` // This will be replaced with actual blob URL
      };
    });

    return NextResponse.json({
      success: true,
      uploads
    });
  } catch (error) {
    console.error("Error in presign route:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

function getContentType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg'
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}
