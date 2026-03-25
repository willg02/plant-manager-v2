import { NextRequest, NextResponse } from "next/server";
import { streamDesignChat } from "@/lib/ai/design-chat";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { regionId, messages, imageData } = await req.json();

    if (!regionId) {
      return NextResponse.json({ error: "regionId is required" }, { status: 400 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const stream = await streamDesignChat(regionId, messages, imageData);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Design chat error:", error);
    return NextResponse.json(
      { error: "Failed to process design request" },
      { status: 500 }
    );
  }
}
