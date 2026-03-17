import { NextRequest, NextResponse } from "next/server";
import { streamChat } from "@/lib/ai/chat-rag";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { regionId, messages } = body;

    if (!regionId) {
      return NextResponse.json(
        { error: "regionId is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return NextResponse.json(
          { error: "Each message must have a role and content" },
          { status: 400 }
        );
      }
      if (msg.role !== "user" && msg.role !== "assistant") {
        return NextResponse.json(
          { error: "Message role must be 'user' or 'assistant'" },
          { status: 400 }
        );
      }
    }

    const stream = await streamChat(regionId, messages);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("POST /api/ai/chat error:", error);

    const message =
      error instanceof Error ? error.message : "Chat request failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
