import { NextRequest, NextResponse } from "next/server";

/**
 * AI Voice search (Advanced feature)
 * Currently disabled in basic mode.
 */
export async function POST(request: NextRequest) {
  // Return empty voices list - feature not available in basic mode
  return NextResponse.json({
    voices: [],
    total: 0,
    page: 1,
    message: "AI voices feature is not available in basic mode"
  });
}
