import { NextRequest, NextResponse } from "next/server";

const PIXABAY_API_URL = "https://pixabay.com/api/audio/";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const page = searchParams.get("page") || "1";
    const perPage = searchParams.get("per_page") || "20";

    const apiKey = process.env.PIXABAY_API_KEY;

    if (!apiKey) {
        console.error("❌ Pexels API Key is missing in process.env");
        return NextResponse.json(
            { error: "Pixabay API key not configured" },
            { status: 500 }
        );
    }

    try {
        const q = query ? encodeURIComponent(query) : "";
        const url = `${PIXABAY_API_URL}?key=${apiKey}&q=${q}&page=${page}&per_page=${perPage}`;

        console.log(`fetching pixabay url: ${url.replace(apiKey, "HIDDEN_KEY")}`);

        const response = await fetch(url, {
            headers: {
                "User-Agent": "CampusHub Video Editor (Education Project)"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Pixabay API responded with status ${response.status}: ${errorText}`);
            throw new Error(`Pixabay API error: ${response.status}`);
        }

        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error("❌ Pixabay Audio API error details:", error);
        return NextResponse.json(
            { error: "Failed to fetch audio from Pixabay" },
            { status: 500 }
        );
    }
}
