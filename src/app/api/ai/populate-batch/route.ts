import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { populatePlantBatch } from "@/lib/ai/populate-plant";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plantIds, regionName } = body;

    if (!Array.isArray(plantIds) || plantIds.length === 0) {
      return NextResponse.json(
        { error: "plantIds array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Verify all plants exist
    const plants = await prisma.plant.findMany({
      where: { id: { in: plantIds } },
      select: { id: true },
    });

    const foundIds = plants.map((p) => p.id);
    const missingIds = plantIds.filter(
      (id: string) => !foundIds.includes(id)
    );

    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          error: `Plants not found: ${missingIds.join(", ")}`,
          missingIds,
        },
        { status: 404 }
      );
    }

    const results = await populatePlantBatch(foundIds, regionName);

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    return NextResponse.json({
      total: results.length,
      succeeded,
      failed: failed.length,
      results,
    });
  } catch (error) {
    console.error("POST /api/ai/populate-batch error:", error);
    return NextResponse.json(
      { error: "Batch AI population failed" },
      { status: 500 }
    );
  }
}
