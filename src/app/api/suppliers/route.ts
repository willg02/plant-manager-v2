import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const regionId = searchParams.get("regionId");

    const where = regionId ? { regionId } : {};

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        region: { select: { id: true, name: true } },
        _count: { select: { availability: true } },
      },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("GET /api/suppliers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, regionId, address, city, state, zip, phone, email, website, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    if (!regionId) {
      return NextResponse.json(
        { error: "regionId is required" },
        { status: 400 }
      );
    }

    // Verify region exists
    const region = await prisma.region.findUnique({
      where: { id: regionId },
    });

    if (!region) {
      return NextResponse.json(
        { error: "Region not found" },
        { status: 404 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        regionId,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        zip: zip?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        notes: notes?.trim() || null,
      },
      include: {
        region: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("POST /api/suppliers error:", error);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}
