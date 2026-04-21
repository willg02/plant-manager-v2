import { prisma } from "@/lib/prisma";
import { claude } from "@/lib/claude";
import { buildChatSystemPrompt } from "./prompts";
import { cached } from "@/lib/cache";

const PLANT_CONTEXT_TTL = 5 * 60 * 1000; // 5 minutes

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function formatPlantContext(
  plants: Array<{
    id: string;
    commonName: string;
    botanicalName: string | null;
    plantType: string | null;
    sunRequirement: string | null;
    waterNeeds: string | null;
    hardinessZoneMin: string | null;
    hardinessZoneMax: string | null;
    matureHeight: string | null;
    matureWidth: string | null;
    bloomTime: string | null;
    bloomColor: string | null;
    description: string | null;
    careTips: string | null;
    availability: Array<{
      price: unknown;
      size: string | null;
      inStock: boolean;
      supplier: { name: string };
    }>;
  }>
): string {
  if (plants.length === 0) return "No plants currently available in this region.";

  return plants
    .map((p) => {
      const avail = p.availability
        .filter((a) => a.inStock)
        .map(
          (a) =>
            `${a.supplier.name}${a.size ? ` (${a.size})` : ""}${a.price ? ` - $${a.price}` : ""}`
        )
        .join("; ");

      return `- ${p.commonName}${p.botanicalName ? ` (${p.botanicalName})` : ""}
  Type: ${p.plantType || "N/A"} | Sun: ${p.sunRequirement || "N/A"} | Water: ${p.waterNeeds || "N/A"}
  Zones: ${p.hardinessZoneMin || "?"}–${p.hardinessZoneMax || "?"} | Size: ${p.matureHeight || "N/A"} H × ${p.matureWidth || "N/A"} W
  Bloom: ${p.bloomTime || "N/A"} (${p.bloomColor || "N/A"})
  ${p.description || ""}
  Available from: ${avail || "Currently out of stock"}`;
    })
    .join("\n\n");
}

export async function retrievePlantContext(
  regionId: string,
  _userMessage: string,
  supplierIds?: string[]
): Promise<string> {
  const filtered = supplierIds?.length ? [...supplierIds].sort() : null;
  const cacheKey = filtered
    ? `plant-context:${regionId}:${filtered.join(",")}`
    : `plant-context:${regionId}`;

  return cached(cacheKey, PLANT_CONTEXT_TTL, async () => {
    const availWhere = filtered
      ? { regionId, supplierId: { in: filtered } }
      : { regionId };

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

    let header = "";
    if (filtered) {
      const suppliers = await prisma.supplier.findMany({
        where: { id: { in: filtered } },
        select: { name: true },
        orderBy: { name: "asc" },
      });
      header = `[Showing plants from: ${suppliers.map((s) => s.name).join(", ")} only]\n\n`;
    }

    return header + formatPlantContext(plants);
  });
}

export async function streamChat(
  regionId: string,
  messages: ChatMessage[],
  supplierIds?: string[]
): Promise<ReadableStream<Uint8Array>> {
  const region = await prisma.region.findUnique({
    where: { id: regionId },
  });

  if (!region) {
    throw new Error("Region not found");
  }

  const lastUserMessage = messages.findLast((m) => m.role === "user");
  const plantContext = await retrievePlantContext(
    regionId,
    lastUserMessage?.content || "",
    supplierIds
  );

  const systemPrompt = buildChatSystemPrompt(
    region.name,
    region.climateZone,
    plantContext
  );

  const stream = await claude.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: systemPrompt,
    messages: messages.slice(-20), // Keep last 10 pairs
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
