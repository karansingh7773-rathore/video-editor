// app/api/transcribe/route.ts
import { NextResponse } from "next/server";

/**
 * Speech-to-text transcription (Advanced feature)
 * Currently disabled in basic mode.
 */
export async function POST(request: Request) {
  // Return a friendly message that this feature is not available
  return NextResponse.json(
    {
      message: "Transcription feature is not available in basic mode",
      hint: "This feature requires an external API. For now, you can manually add text captions."
    },
    { status: 501 } // Not Implemented
  );
}
