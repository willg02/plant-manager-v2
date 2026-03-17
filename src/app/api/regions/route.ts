import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const regions = await prisma.region.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { suppliers: true } },
      },
    });

    return NextResponse.json(regions);
  } catch (error) {
    console.error("GET /api/regions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch regions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, state, description, climateZone } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await prisma.region.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A region with this name already exists" },
        { status: 409 }
      );
    }

    const region = await prisma.region.create({
      data: {
        name: name.trim(),
        state: state?.trim() || null,
        description: description?.trim() || null,
        climateZone: climateZone?.trim() || null,
      },
    });

    return NextResponse.json(region, { status: 201 });
  } catch (error) {
    console.error("POST /api/regions error:", error);
    return NextResponse.json(
      { error: "Failed to create region" },
      { status: 500 }
    );
  }
}
