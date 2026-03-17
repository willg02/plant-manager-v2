import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const { supplierId } = await params;

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        region: { select: { id: true, name: true } },
        availability: {
          include: {
            plant: { select: { id: true, commonName: true, botanicalName: true } },
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("GET /api/suppliers/[supplierId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch supplier" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const { supplierId } = await params;
    const body = await request.json();

    const existing = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "name",
      "regionId",
      "address",
      "city",
      "state",
      "zip",
      "phone",
      "email",
      "website",
      "notes",
      "isActive",
    ];

    for (const field of allowedFields) {
      if (field in body) {
        if (field === "isActive") {
          updateData[field] = Boolean(body[field]);
        } else {
          updateData[field] = body[field]?.trim?.() || body[field] || null;
        }
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: updateData,
      include: {
        region: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("PUT /api/suppliers/[supplierId] error:", error);
    return NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const { supplierId } = await params;

    const existing = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    await prisma.supplier.delete({ where: { id: supplierId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/suppliers/[supplierId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
