import { NextRequest, NextResponse } from "next/server";

interface UploadUrlRequest {
  userId: string;
  urls: string[];
}

/**
 * This route handles uploading media from URLs (e.g., Pexels stock photos/videos).
 * Since we're using local mode, we'll just return the original URLs
 * which can be used directly in the browser.
 */
export async function POST(request: NextRequest) {
  try {
    const body: UploadUrlRequest = await request.json();
    const { userId, urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "urls array is required and must not be empty" },
        { status: 400 }
      );
    }

    // For local mode, we just return the URLs as-is
    // The browser can fetch them directly
    const uploads = urls.map((url, index) => {
      const fileName = extractFileName(url) || `media-${index}`;
      const folder = `url-import-${Date.now()}`;

      return {
        fileName,
        filePath: `/${folder}/${fileName}`,
        contentType: getContentType(fileName),
        originalUrl: url,
        folder,
        url: url // Use the original URL directly
      };
    });

    return NextResponse.json({
      success: true,
      uploads
    });
  } catch (error) {
    console.error("Error in upload URL route:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

function extractFileName(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];
    return lastSegment || `file-${Date.now()}`;
  } catch {
    return `file-${Date.now()}`;
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
