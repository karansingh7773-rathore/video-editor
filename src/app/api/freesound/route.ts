import { NextRequest, NextResponse } from "next/server";

const FREESOUND_API_URL = "https://freesound.org/apiv2/search/text/";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("page_size") || "15";

    const apiKey = process.env.FREESOUND_API_KEY;

    if (!apiKey) {
        console.error("❌ Freesound API Key is missing in process.env");
        return NextResponse.json(
            { error: "Freesound API key not configured" },
            { status: 500 }
        );
    }

    try {
        // Build URL with query parameters
        const url = new URL(FREESOUND_API_URL);
        url.searchParams.set("query", query || "music");
        url.searchParams.set("page", page);
        url.searchParams.set("page_size", pageSize);
        // Request specific fields we need
        url.searchParams.set("fields", "id,name,duration,username,previews,tags");

        console.log(`Fetching Freesound: ${url.toString().replace(apiKey, "HIDDEN")}`);

        const response = await fetch(url.toString(), {
            headers: {
                "Authorization": `Token ${apiKey}`,
                "User-Agent": "CampusHub Video Editor"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Freesound API error ${response.status}: ${errorText}`);
            throw new Error(`Freesound API error: ${response.status}`);
        }

        const data = await response.json();

        // Transform response to match our expected format
        const transformedResults = (data.results || []).map((sound: any) => ({
            id: `freesound_${sound.id}`,
            name: sound.name,
            type: "audio",
            details: {
                src: sound.previews?.["preview-hq-mp3"] || sound.previews?.["preview-lq-mp3"] || ""
            },
            metadata: {
                author: sound.username,
                duration: sound.duration,
                tags: sound.tags?.slice(0, 3) || [],
                freesoundId: sound.id
            }
        }));

        return NextResponse.json({
            results: transformedResults,
            count: data.count || 0,
            next: data.next,
            previous: data.previous
        });
    } catch (error) {
        console.error("❌ Freesound API error details:", error);
        return NextResponse.json(
            { error: "Failed to fetch audio from Freesound" },
            { status: 500 }
        );
    }
}
