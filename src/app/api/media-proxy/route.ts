import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint for downloading external media files.
 * This is needed because external URLs (like Pexels videos) have CORS restrictions
 * that prevent direct download from the browser.
 * 
 * Usage: POST /api/media-proxy
 * Body: { url: "https://example.com/video.mp4" }
 */
export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
        }

        console.log(`[Media Proxy] Downloading: ${url}`);

        // Fetch the media file
        const response = await fetch(url, {
            headers: {
                // Some CDNs require a user-agent
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });

        if (!response.ok) {
            console.error(`[Media Proxy] Failed to fetch: ${response.status}`);
            return NextResponse.json(
                { error: `Failed to download: ${response.status}` },
                { status: response.status }
            );
        }

        // Get content type from the response
        const contentType = response.headers.get("content-type") || "application/octet-stream";

        // Stream the response body
        const data = await response.arrayBuffer();

        console.log(`[Media Proxy] Downloaded ${data.byteLength} bytes, type: ${contentType}`);

        return new NextResponse(data, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Length": data.byteLength.toString()
            }
        });

    } catch (error) {
        console.error("[Media Proxy] Error:", error);
        return NextResponse.json(
            { error: "Failed to proxy media request" },
            { status: 500 }
        );
    }
}
