import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { fetchPlantImage } from "@/lib/plants/fetch-plant-image";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plantId } = await request.json();
    if (!plantId) {
      return NextResponse.json({ error: "plantId is required" }, { status: 400 });
    }

    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      select: { id: true, commonName: true, botanicalName: true },
    });

    if (!plant) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }

    const imageUrl = await fetchPlantImage(plant.botanicalName, plant.commonName);

    if (!imageUrl) {
      return NextResponse.json({ success: false, plantId, imageUrl: null });
    }

    await prisma.plant.update({
      where: { id: plantId },
      data: { imageUrl },
    });

    return NextResponse.json({ success: true, plantId, imageUrl });
  } catch (error) {
    console.error("POST /api/ai/populate-image error:", error);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
