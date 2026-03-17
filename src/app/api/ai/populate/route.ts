import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { populatePlant } from "@/lib/ai/populate-plant";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plantId, regionName } = body;

    if (!plantId) {
      return NextResponse.json(
        { error: "plantId is required" },
        { status: 400 }
      );
    }

    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
    });

    if (!plant) {
      return NextResponse.json(
        { error: "Plant not found" },
        { status: 404 }
      );
    }

    const result = await populatePlant(plantId, regionName);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "AI population failed" },
        { status: 500 }
      );
    }

    // Return the updated plant
    const updatedPlant = await prisma.plant.findUnique({
      where: { id: plantId },
    });

    return NextResponse.json({
      success: true,
      plant: updatedPlant,
    });
  } catch (error) {
    console.error("POST /api/ai/populate error:", error);
    return NextResponse.json(
      { error: "AI population failed" },
      { status: 500 }
    );
  }
}
