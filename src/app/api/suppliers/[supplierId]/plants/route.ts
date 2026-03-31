import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/suppliers/[supplierId]/plants
// Removes all PlantAvailability records for this supplier, then deletes any
// Plant records that are no longer referenced by any availability record.
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

    // Collect plant IDs belonging to this supplier before deletion
    const availability = await prisma.plantAvailability.findMany({
      where: { supplierId },
      select: { plantId: true },
    });
    const plantIds = [...new Set(availability.map((a) => a.plantId))];

    // Delete this supplier's availability records
    await prisma.plantAvailability.deleteMany({ where: { supplierId } });

    // Delete plants that have no remaining availability records (orphans)
    let deletedPlants = 0;
    if (plantIds.length > 0) {
      const stillReferenced = await prisma.plantAvailability.findMany({
        where: { plantId: { in: plantIds } },
        select: { plantId: true },
      });
      const referencedIds = new Set(stillReferenced.map((a) => a.plantId));
      const orphanIds = plantIds.filter((id) => !referencedIds.has(id));

      if (orphanIds.length > 0) {
        const result = await prisma.plant.deleteMany({
          where: { id: { in: orphanIds } },
        });
        deletedPlants = result.count;
      }
    }

    return NextResponse.json({
      success: true,
      deletedAvailability: availability.length,
      deletedPlants,
    });
  } catch (error) {
    console.error("DELETE /api/suppliers/[supplierId]/plants error:", error);
    return NextResponse.json(
      { error: "Failed to clear plants" },
      { status: 500 }
    );
  }
}
