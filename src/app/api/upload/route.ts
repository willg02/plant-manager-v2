import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@/generated/prisma";
import { invalidateCache } from "@/lib/cache";

interface UploadRow {
  commonName: string;
  botanicalName?: string;
  price?: number;
  size?: string;
  inStock?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { supplierId, regionId, fileName, rows, syncMode, listTag } = body as {
      supplierId: string;
      regionId: string;
      fileName?: string;
      rows: UploadRow[];
      syncMode?: boolean;
      listTag?: string; // e.g. "Shrubs", "Trees" — scopes sync deletions
    };

    if (!supplierId || !regionId) {
      return NextResponse.json(
        { error: "supplierId and regionId are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "rows array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Verify supplier and region exist
    const [supplier, region] = await Promise.all([
      prisma.supplier.findUnique({ where: { id: supplierId } }),
      prisma.region.findUnique({ where: { id: regionId } }),
    ]);

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }
    if (!region) {
      return NextResponse.json(
        { error: "Region not found" },
        { status: 404 }
      );
    }

    // Create upload log entry
    const uploadLog = await prisma.uploadLog.create({
      data: {
        fileName: fileName || "upload.csv",
        supplierId,
        regionId,
        rowCount: rows.length,
        uploadedBy: userId,
        status: "processing",
      },
    });

    const plantIds: string[] = [];
    let addedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors: Array<{ row: number; error: string }> = [];
    const normalizedTag = listTag?.trim() || null;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row.commonName || !row.commonName.trim()) {
        errorCount++;
        errors.push({ row: i + 1, error: "Missing commonName" });
        continue;
      }

      try {
        // Dedup: check if plant with this commonName already exists
        let plant = await prisma.plant.findFirst({
          where: {
            commonName: {
              equals: row.commonName.trim(),
              mode: "insensitive",
            },
          },
        });

        if (!plant) {
          plant = await prisma.plant.create({
            data: {
              commonName: row.commonName.trim(),
              botanicalName: row.botanicalName?.trim() || null,
            },
          });
        }

        // Create or update availability record
        const existingAvail = await prisma.plantAvailability.findFirst({
          where: {
            plantId: plant.id,
            supplierId,
            size: row.size || null,
          },
        });

        if (existingAvail) {
          await prisma.plantAvailability.update({
            where: { id: existingAvail.id },
            data: {
              price: row.price !== undefined
                ? new Prisma.Decimal(row.price)
                : existingAvail.price,
              inStock: row.inStock !== undefined ? row.inStock : existingAvail.inStock,
              regionId,
              listTag: normalizedTag,
            },
          });
          updatedCount++;
        } else {
          await prisma.plantAvailability.create({
            data: {
              plantId: plant.id,
              supplierId,
              regionId,
              price: row.price !== undefined
                ? new Prisma.Decimal(row.price)
                : null,
              size: row.size || null,
              inStock: row.inStock !== undefined ? row.inStock : true,
              listTag: normalizedTag,
            },
          });
          addedCount++;
        }

        plantIds.push(plant.id);
      } catch (err) {
        errorCount++;
        errors.push({
          row: i + 1,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // ── Sync mode: remove availability records not in this upload ────────────
    // Scope: same supplier + same listTag (or all records if no tag provided).
    let removedCount = 0;
    if (syncMode && plantIds.length > 0) {
      const deleteWhere: Prisma.PlantAvailabilityWhereInput = {
        supplierId,
        plantId: { notIn: plantIds },
        ...(normalizedTag !== null
          ? { listTag: normalizedTag }
          : {}),
      };

      const { count } = await prisma.plantAvailability.deleteMany({
        where: deleteWhere,
      });
      removedCount = count;
    }

    const successCount = addedCount + updatedCount;

    // Update upload log
    await prisma.uploadLog.update({
      where: { id: uploadLog.id },
      data: {
        successCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined,
        status: errorCount === rows.length ? "failed" : "completed",
        completedAt: new Date(),
      },
    });

    // Invalidate plant context caches since inventory changed
    invalidateCache("plant-context:");
    invalidateCache("design-plants:");

    return NextResponse.json({
      added: addedCount,
      updated: updatedCount,
      errors: errorCount,
      removed: removedCount,
      plantIds,
      uploadLogId: uploadLog.id,
      errorDetails: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
