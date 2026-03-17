import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ plantId: string }> }
) {
  try {
    const { plantId } = await params;

    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: {
        availability: {
          include: {
            supplier: { select: { id: true, name: true } },
            region: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!plant) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }

    return NextResponse.json(plant);
  } catch (error) {
    console.error("GET /api/plants/[plantId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch plant" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ plantId: string }> }
) {
  try {
    const { plantId } = await params;
    const body = await request.json();

    const existing = await prisma.plant.findUnique({
      where: { id: plantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "commonName",
      "botanicalName",
      "plantType",
      "family",
      "hardinessZoneMin",
      "hardinessZoneMax",
      "sunRequirement",
      "waterNeeds",
      "soilPreference",
      "matureHeight",
      "matureWidth",
      "growthRate",
      "bloomTime",
      "bloomColor",
      "foliageColor",
      "nativeRegion",
      "description",
      "careTips",
      "imageUrl",
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field] || null;
      }
    }

    // Handle array fields
    if ("alternateNames" in body) {
      updateData.alternateNames = Array.isArray(body.alternateNames)
        ? body.alternateNames
        : [];
    }
    if ("companionPlants" in body) {
      updateData.companionPlants = Array.isArray(body.companionPlants)
        ? body.companionPlants
        : [];
    }

    const plant = await prisma.plant.update({
      where: { id: plantId },
      data: updateData,
      include: {
        availability: {
          include: {
            supplier: { select: { id: true, name: true } },
            region: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(plant);
  } catch (error) {
    console.error("PUT /api/plants/[plantId] error:", error);
    return NextResponse.json(
      { error: "Failed to update plant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ plantId: string }> }
) {
  try {
    const { plantId } = await params;

    const existing = await prisma.plant.findUnique({
      where: { id: plantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }

    await prisma.plant.delete({ where: { id: plantId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/plants/[plantId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete plant" },
      { status: 500 }
    );
  }
}
