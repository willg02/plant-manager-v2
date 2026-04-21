import { NextRequest, NextResponse } from "next/server";
import { claude } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 45;

interface ExtractRequest {
  imageUrl: string;
  referenceEdgeDescription: string; // e.g. "front edge along the driveway"
  referenceEdgeLengthFeet: number;
}

interface ExtractedPolygon {
  vertices: Array<{ x: number; y: number }>;
  reasoning: string;
  confidence: "high" | "medium" | "low";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExtractRequest;
    const { imageUrl, referenceEdgeDescription, referenceEdgeLengthFeet } = body;

    if (!imageUrl || !referenceEdgeDescription || !(referenceEdgeLengthFeet > 0)) {
      return NextResponse.json(
        {
          error:
            "imageUrl, referenceEdgeDescription, and a positive referenceEdgeLengthFeet are required",
        },
        { status: 400 }
      );
    }

    const response = await claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      tools: [
        {
          name: "extract_bed_polygon",
          description:
            "Record the traced polygon of the garden bed visible in the image, expressed in feet using the user-supplied reference edge for scale.",
          input_schema: {
            type: "object",
            properties: {
              vertices: {
                type: "array",
                description:
                  "Vertices of the bed polygon in counter-clockwise order, with origin at the bottom-left corner of the bed's bounding box and positive Y pointing away from the viewer (north-ish). Units: feet.",
                items: {
                  type: "object",
                  properties: {
                    x: { type: "number" },
                    y: { type: "number" },
                  },
                  required: ["x", "y"],
                },
                minItems: 3,
                maxItems: 24,
              },
              reasoning: {
                type: "string",
                description:
                  "One or two sentences describing how you identified the bed and mapped the reference edge to set scale.",
              },
              confidence: {
                type: "string",
                enum: ["high", "medium", "low"],
              },
            },
            required: ["vertices", "reasoning", "confidence"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "extract_bed_polygon" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: imageUrl },
            },
            {
              type: "text",
              text: `I want you to trace the outline of the garden bed shown in this image and return its polygon in feet.

Reference edge for scale: "${referenceEdgeDescription}" = ${referenceEdgeLengthFeet} ft.

Rules:
- Identify the bed's edge corresponding to my reference description and use its length to set scale for the whole polygon.
- Output vertices in counter-clockwise order starting from the bottom-left.
- Use an origin at the bed's bottom-left corner so every vertex has x ≥ 0 and y ≥ 0.
- Keep the vertex count minimal (straight edges should be 2 points, not 10). Use more points only for genuine curves.
- If the image is ambiguous or the bed is partially hidden, set confidence to "low" and describe what you assumed.

Call the extract_bed_polygon tool with your result.`,
            },
          ],
        },
      ],
    });

    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json(
        { error: "Claude did not return a polygon" },
        { status: 502 }
      );
    }

    const result = toolUse.input as ExtractedPolygon;

    if (!result.vertices || result.vertices.length < 3) {
      return NextResponse.json(
        { error: "Extracted polygon has fewer than 3 vertices" },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/design/extract-bed-polygon error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
