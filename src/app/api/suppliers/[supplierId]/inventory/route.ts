import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/suppliers/[supplierId]/inventory
// Removes all PlantAvailability records for this supplier.
// Plants remain in the global catalog.
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

    const { count } = await prisma.plantAvailability.deleteMany({
      where: { supplierId },
    });

    return NextResponse.json({ success: true, deleted: count });
  } catch (error) {
    console.error("DELETE /api/suppliers/[supplierId]/inventory error:", error);
    return NextResponse.json(
      { error: "Failed to clear inventory" },
      { status: 500 }
    );
  }
}
