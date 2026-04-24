import { prisma } from "@/lib/prisma";
import { claude } from "@/lib/claude";
import { POPULATE_SYSTEM_PROMPT, buildPopulateUserPrompt } from "./prompts";
import { parseDimensionToFeet } from "@/lib/plants/parse-dimensions";

interface PopulateResult {
  success: boolean;
  plantId: string;
  error?: string;
}

export async function populatePlant(
  plantId: string,
  regionName?: string
): Promise<PopulateResult> {
  const plant = await prisma.plant.findUnique({ where: { id: plantId } });

  if (!plant) {
    return { success: false, plantId, error: "Plant not found" };
  }

  try {
    const message = await claude.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      system: POPULATE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildPopulateUserPrompt(plant.commonName, regionName),
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const data = JSON.parse(responseText);

    await prisma.plant.update({
      where: { id: plantId },
      data: {
        botanicalName: data.botanicalName || null,
        alternateNames: data.alternateNames || [],
        plantType: data.plantType || null,
        family: data.family || null,
        hardinessZoneMin: data.hardinessZoneMin || null,
        hardinessZoneMax: data.hardinessZoneMax || null,
        sunRequirement: data.sunRequirement || null,
        waterNeeds: data.waterNeeds || null,
        soilPreference: data.soilPreference || null,
        matureHeight: data.matureHeight || null,
        matureWidth: data.matureWidth || null,
        matureHeightFeet: parseDimensionToFeet(data.matureHeight),
        matureWidthFeet: parseDimensionToFeet(data.matureWidth),
        growthRate: data.growthRate || null,
        bloomTime: data.bloomTime || null,
        bloomColor: data.bloomColor || null,
        foliageColor: data.foliageColor || null,
        nativeRegion: data.nativeRegion || null,
        description: data.description || null,
        careTips: data.careTips || null,
        companionPlants: data.companionPlants || [],
        aiPopulated: true,
        aiPopulatedAt: new Date(),
        aiModel: "claude-haiku-4-5",
        aiConfidence: data.confidence || "medium",
      },
    });

    return { success: true, plantId };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, plantId, error: errorMessage };
  }
}

export async function populatePlantBatch(
  plantIds: string[],
  regionName?: string,
  concurrency = 5
): Promise<PopulateResult[]> {
  const results: PopulateResult[] = [];

  // Process in concurrent chunks instead of one-by-one
  for (let i = 0; i < plantIds.length; i += concurrency) {
    const chunk = plantIds.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map((id) => populatePlant(id, regionName))
    );
    results.push(...chunkResults);
  }

  return results;
}
