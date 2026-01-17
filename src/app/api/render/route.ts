import { NextResponse } from "next/server";

// Your Hugging Face Space backend URL
const HF_SPACE_URL = process.env.HF_SPACE_URL || "https://karansinghrathore820-myvirtualmachine.hf.space";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { design, options } = body;

    // Extract video segments from the timeline
    const segments = extractSegmentsFromDesign(design);

    if (segments.length === 0) {
      return NextResponse.json(
        { message: "No video segments found in timeline" },
        { status: 400 }
      );
    }

    // For now, we'll return the edit decision list as JSON
    // The actual rendering will be done when user downloads
    const editPayload = {
      id: design.id || `edit-${Date.now()}`,
      segments,
      settings: {
        outputFormat: options?.format || "mp4",
        fps: options?.fps || 30,
        quality: "medium",
        removeAudio: false
      }
    };

    // Return immediately with a "render" object that the frontend expects
    return NextResponse.json({
      render: {
        id: editPayload.id,
        status: "PENDING",
        progress: 0,
        editPayload // Store the payload for later rendering
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Extract video segments from designcombo design JSON
 */
function extractSegmentsFromDesign(design: any): Array<{
  id: string;
  startTime: number;
  endTime: number;
  speed: number;
  sourceUrl?: string;
}> {
  const segments: Array<{
    id: string;
    startTime: number;
    endTime: number;
    speed: number;
    sourceUrl?: string;
  }> = [];

  // Navigate through the design structure
  const trackItems = design?.trackItemsMap || {};

  for (const [id, item] of Object.entries(trackItems as Record<string, any>)) {
    // Only process video items
    if (item.type === "video") {
      segments.push({
        id,
        startTime: (item.trim?.from || 0) / 1000, // ms to seconds
        endTime: ((item.trim?.from || 0) + (item.duration || 0)) / 1000,
        speed: item.playbackRate || 1,
        sourceUrl: item.details?.src
      });
    }
  }

  // Sort by timeline position
  segments.sort((a, b) => a.startTime - b.startTime);

  return segments;
}
