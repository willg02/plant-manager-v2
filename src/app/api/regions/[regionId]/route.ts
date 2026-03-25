import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ regionId: string }> }
) {
  try {
    const { regionId } = await params;
    const region = await prisma.region.findUnique({ where: { id: regionId } });
    if (!region) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }
    return NextResponse.json(region);
  } catch (error) {
    console.error("GET /api/regions/[regionId] error:", error);
    return NextResponse.json({ error: "Failed to fetch region" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ regionId: string }> }
) {
  try {
    const { regionId } = await params;
    const body = await request.json();

    const existing = await prisma.region.findUnique({ where: { id: regionId } });
    if (!existing) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Region name is required" }, { status: 400 });
    }

    // Check for duplicate name (excluding this region)
    const duplicate = await prisma.region.findFirst({
      where: { name: body.name.trim(), NOT: { id: regionId } },
    });
    if (duplicate) {
      return NextResponse.json({ error: "A region with that name already exists" }, { status: 409 });
    }

    const region = await prisma.region.update({
      where: { id: regionId },
      data: {
        name: body.name.trim(),
        state: body.state?.trim() || null,
        climateZone: body.climateZone?.trim() || null,
        description: body.description?.trim() || null,
      },
    });

    return NextResponse.json(region);
  } catch (error) {
    console.error("PUT /api/regions/[regionId] error:", error);
    return NextResponse.json({ error: "Failed to update region" }, { status: 500 });
  }
}
