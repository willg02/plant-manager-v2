import { prisma } from "@/lib/prisma";
import { claude } from "@/lib/claude";
import { buildDesignSystemPrompt } from "./prompts";
import { cached } from "@/lib/cache";

const DESIGN_CONTEXT_TTL = 5 * 60 * 1000; // 5 minutes

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ImageData {
  base64: string;
  mediaType: string;
}

async function getAllInStockPlants(regionId: string, supplierIds?: string[]): Promise<string> {
  const filtered = supplierIds?.length ? [...supplierIds].sort() : null;
  const cacheKey = filtered
    ? `design-plants:${regionId}:${filtered.join(",")}`
    : `design-plants:${regionId}`;

  return cached(cacheKey, DESIGN_CONTEXT_TTL, async () => {
    const availWhere = filtered
      ? { regionId, inStock: true, supplierId: { in: filtered } }
      : { regionId, inStock: true };

    const plants = await prisma.plant.findMany({
      where: { availability: { some: availWhere } },
      include: {
        availability: {
          where: availWhere,
          include: { supplier: { select: { name: true } } },
        },
      },
      orderBy: { commonName: "asc" },
    });

    if (plants.length === 0) return "No plants currently in stock for this region.";

    let header = "";
    if (filtered) {
      const suppliers = await prisma.supplier.findMany({
        where: { id: { in: filtered } },
        select: { name: true },
        orderBy: { name: "asc" },
      });
      header = `[Showing plants from: ${suppliers.map((s) => s.name).join(", ")} only]\n\n`;
    }

    return (
      header +
      plants
        .map((p) => {
          const avail = p.availability
            .map(
              (a) =>
                `${a.supplier.name}${a.size ? ` (${a.size})` : ""}${a.price ? ` - $${a.price}` : ""}`
            )
            .join("; ");

          return `- [${p.id}] ${p.commonName}${p.botanicalName ? ` (${p.botanicalName})` : ""}
  Type: ${p.plantType || "N/A"} | Sun: ${p.sunRequirement || "N/A"} | Water: ${p.waterNeeds || "N/A"}
  Zones: ${p.hardinessZoneMin || "?"}–${p.hardinessZoneMax || "?"} | Size: ${p.matureHeight || "N/A"} H × ${p.matureWidth || "N/A"} W
  Bloom: ${p.bloomTime || "N/A"} (${p.bloomColor || "N/A"}) | Growth: ${p.growthRate || "N/A"}
  In stock at: ${avail}`;
        })
        .join("\n\n")
    );
  });
}

export async function streamDesignChat(
  regionId: string,
  messages: ChatMessage[],
  imageData?: ImageData,
  supplierIds?: string[]
): Promise<ReadableStream<Uint8Array>> {
  const region = await prisma.region.findUnique({ where: { id: regionId } });
  if (!region) throw new Error("Region not found");

  const plantContext = await getAllInStockPlants(regionId, supplierIds);
  const systemPrompt = buildDesignSystemPrompt(
    region.name,
    region.climateZone,
    plantContext
  );

  const recentMessages = messages.slice(-20);

  // Build Claude messages — inject image into last user message if provided
  const claudeMessages = recentMessages.map((msg, i) => {
    const isLastUser =
      imageData &&
      i === recentMessages.length - 1 &&
      msg.role === "user";

    if (isLastUser) {
      return {
        role: "user" as const,
        content: [
          {
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: imageData.mediaType as
                | "image/jpeg"
                | "image/png"
                | "image/gif"
                | "image/webp",
              data: imageData.base64,
            },
          },
          {
            type: "text" as const,
            text: msg.content || "Here is a photo of my space.",
          },
        ],
      };
    }

    return {
      role: msg.role as "user" | "assistant",
      content: msg.content,
    };
  });

  const stream = await claude.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    system: systemPrompt,
    messages: claudeMessages,
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    },
  });
}
