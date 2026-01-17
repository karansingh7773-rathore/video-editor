import { NextResponse } from "next/server";

// Simple in-memory store for render jobs (in production, use Redis or similar)
const renderJobs = new Map<string, {
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  presigned_url?: string;
  error?: string;
}>();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "id parameter is required" },
        { status: 400 }
      );
    }

    // For the basic version, we'll simulate immediate completion
    // The actual rendering will happen on download
    // In a future version, this would poll the HF Space for render status

    return NextResponse.json({
      render: {
        id,
        status: "COMPLETED",
        progress: 100,
        // For now, we return a status that tells the frontend 
        // to show a "Download JSON" option instead of video
        message: "Edit decision list ready. Click download to get the JSON."
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Status check error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
