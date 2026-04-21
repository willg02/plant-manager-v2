import { NextRequest, NextResponse } from "next/server";
import { claude } from "@/lib/claude";
import type { BedVertex, PlantPlacement, DesignLayout, SunOrientation } from "@/lib/design/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_RETRIES = 2;

interface GenerateRequest {
  bedPolygon: BedVertex[];
  shortlist: Array<{ plantId: string; name: string }>;
  goals?: string;
  sunOrientation: SunOrientation;
}

interface RawPlacement {
  plantId: string;
  x: number;
  y: number;
  spreadRadius: number;
  quantity: number;
}

interface ToolResult {
  placements: RawPlacement[];
  notes: string;
}

// Ray-casting point-in-polygon
function pointInPolygon(px: number, py: number, polygon: BedVertex[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function validatePlacements(placements: RawPlacement[], polygon: BedVertex[]): string[] {
  const errors: string[] = [];

  for (const p of placements) {
    if (!pointInPolygon(p.x, p.y, polygon)) {
      errors.push(
        `Plant "${p.plantId}" at (${p.x.toFixed(1)}, ${p.y.toFixed(1)}) is outside the bed polygon.`
      );
    }
  }

  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = placements[i];
      const b = placements[j];
      const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
      const minDist = (a.spreadRadius + b.spreadRadius) * 0.9;
      if (dist < minDist) {
        errors.push(
          `Plants "${a.plantId}" and "${b.plantId}" overlap (gap ${dist.toFixed(1)} ft, need ${minDist.toFixed(1)} ft).`
        );
      }
    }
  }

  return errors;
}

const PLACE_PLANTS_TOOL = {
  name: "place_plants",
  description: "Output a landscape planting layout for the described bed.",
  input_schema: {
    type: "object" as const,
    properties: {
      placements: {
        type: "array",
        description: "One entry per plant instance placed in the bed.",
        items: {
          type: "object",
          properties: {
            plantId: {
              type: "string",
              description: "Must match an id from the shortlist.",
            },
            x: {
              type: "number",
              description:
                "Distance in feet from the left (west) edge of the bounding box. Must be inside the polygon.",
            },
            y: {
              type: "number",
              description:
                "Distance in feet from the bottom (south) edge. Taller plants go toward the back (higher y).",
            },
            spreadRadius: {
              type: "number",
              description: "Estimated mature spread radius in feet (half mature width). Min 0.5.",
            },
            quantity: {
              type: "number",
              description:
                "Individual plants at this position. Typically 1; use >1 only for tight groundcover clusters.",
            },
          },
          required: ["plantId", "x", "y", "spreadRadius", "quantity"],
        },
        minItems: 1,
      },
      notes: {
        type: "string",
        description:
          "2–4 sentence design rationale covering plant choices, sun/shade placement, and seasonal interest.",
      },
    },
    required: ["placements", "notes"],
  },
};

const SUN_LABELS: Record<SunOrientation, string> = {
  N: "North — back of bed gets afternoon sun, front is shadier",
  S: "South — bed faces away from the sun; front gets most light",
  E: "East — morning sun on the front edge",
  W: "West — afternoon sun on the front edge",
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequest;
    const { bedPolygon, shortlist, goals, sunOrientation } = body;

    if (!bedPolygon || bedPolygon.length < 3) {
      return NextResponse.json(
        { error: "bedPolygon must have at least 3 vertices" },
        { status: 400 }
      );
    }
    if (!shortlist || shortlist.length === 0) {
      return NextResponse.json(
        { error: "shortlist must contain at least one plant" },
        { status: 400 }
      );
    }

    const bbox = {
      minX: Math.min(...bedPolygon.map((v) => v.x)),
      maxX: Math.max(...bedPolygon.map((v) => v.x)),
      minY: Math.min(...bedPolygon.map((v) => v.y)),
      maxY: Math.max(...bedPolygon.map((v) => v.y)),
    };
    const width = (bbox.maxX - bbox.minX).toFixed(1);
    const depth = (bbox.maxY - bbox.minY).toFixed(1);
    const polygonStr = bedPolygon.map((v) => `(${v.x},${v.y})`).join(" → ");
    const shortlistStr = shortlist.map((p) => `  - ${p.name} (id: ${p.plantId})`).join("\n");

    const userMessage = `Design a planting layout for this bed.

Bed polygon (feet, counter-clockwise from bottom-left): ${polygonStr}
Bounding box: x 0–${width} ft wide, y 0–${depth} ft deep
Front of bed faces: ${SUN_LABELS[sunOrientation]}

Plants available (repeat any plant as many times as needed):
${shortlistStr}

Design goals: ${goals?.trim() || "balanced, attractive, low-maintenance planting"}

Every placement center must be inside the polygon. Center-to-center distance between any two plants must be ≥ 90% of the sum of their spread radii.

Call place_plants with your layout.`;

    type Message = { role: "user" | "assistant"; content: string | unknown[] };
    const messages: Message[] = [{ role: "user", content: userMessage }];

    let lastResult: ToolResult | null = null;
    let validationErrors: string[] = [];

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await claude.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        system:
          "You are a professional landscape designer. Place plants from the shortlist into the bed coordinates. Follow design principles: tall plants to the back, mass plantings for impact, proper spacing for mature size. Every center must be inside the polygon; no two plants may overlap.",
        tools: [PLACE_PLANTS_TOOL],
        tool_choice: { type: "tool", name: "place_plants" },
        messages: messages as Parameters<typeof claude.messages.create>[0]["messages"],
      });

      const toolUse = response.content.find((c) => c.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        return NextResponse.json({ error: "Claude did not return a layout" }, { status: 502 });
      }

      lastResult = toolUse.input as ToolResult;
      validationErrors = validatePlacements(lastResult.placements, bedPolygon);

      if (validationErrors.length === 0) break;

      if (attempt < MAX_RETRIES) {
        messages.push({ role: "assistant", content: response.content });
        messages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: `Validation failed. Fix these issues and call place_plants again:\n${validationErrors.join("\n")}`,
            },
          ],
        });
      }
    }

    if (!lastResult) {
      return NextResponse.json({ error: "Failed to generate layout" }, { status: 502 });
    }

    const notes =
      validationErrors.length > 0
        ? `[Some placements may need adjustment] ${lastResult.notes}`
        : lastResult.notes;

    const placements: PlantPlacement[] = lastResult.placements.map((p) => ({
      plantId: p.plantId,
      x: p.x,
      y: p.y,
      spreadRadius: p.spreadRadius,
      quantity: p.quantity,
    }));

    const layout: DesignLayout = {
      placements,
      notes,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(layout);
  } catch (err) {
    console.error("POST /api/design/generate-layout error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
