import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { populatePlant } from "@/lib/ai/populate-plant";
import { Prisma } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const regionId = searchParams.get("regionId");
    const supplierId = searchParams.get("supplierId");
    const type = searchParams.get("type");
    const sun = searchParams.get("sun");
    const water = searchParams.get("water");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const where: Prisma.PlantWhereInput = {};
    const conditions: Prisma.PlantWhereInput[] = [];

    if (regionId || supplierId) {
      const availWhere: Prisma.PlantAvailabilityWhereInput = {};
      if (regionId) availWhere.regionId = regionId;
      if (supplierId) availWhere.supplierId = supplierId;
      where.availability = { some: availWhere };
    }

    if (type) where.plantType = type;
    if (sun) where.sunRequirement = sun;
    if (water) where.waterNeeds = water;

    if (search) {
      conditions.push(
        { commonName: { contains: search, mode: "insensitive" } },
        { botanicalName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      );
      where.OR = conditions;
    }

    const skip = (page - 1) * limit;

    const orderBy: Prisma.PlantOrderByWithRelationInput = {};
    const validSortFields = [
      "commonName",
      "botanicalName",
      "plantType",
      "createdAt",
      "updatedAt",
    ];
    const sortField = validSortFields.includes(sort) ? sort : "createdAt";
    (orderBy as Record<string, string>)[sortField] = order === "asc" ? "asc" : "desc";

    const [plants, total] = await Promise.all([
      prisma.plant.findMany({
        where,
        include: {
          availability: {
            include: { supplier: { select: { id: true, name: true } } },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.plant.count({ where }),
    ]);

    return NextResponse.json({
      data: plants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/plants error:", error);
    return NextResponse.json(
      { error: "Failed to fetch plants" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      commonName,
      botanicalName,
      supplierId,
      regionId,
      price,
      size,
      inStock,
      autoPopulate,
    } = body;

    if (!commonName || !commonName.trim()) {
      return NextResponse.json(
        { error: "commonName is required" },
        { status: 400 }
      );
    }

    const plant = await prisma.plant.create({
      data: {
        commonName: commonName.trim(),
        botanicalName: botanicalName?.trim() || null,
      },
    });

    // Create availability record if supplier and region provided
    if (supplierId && regionId) {
      await prisma.plantAvailability.create({
        data: {
          plantId: plant.id,
          supplierId,
          regionId,
          price: price ? new Prisma.Decimal(price) : null,
          size: size || null,
          inStock: inStock !== undefined ? inStock : true,
        },
      });
    }

    // Trigger AI populate if requested
    if (autoPopulate) {
      // Get region name for context
      let regionName: string | undefined;
      if (regionId) {
        const region = await prisma.region.findUnique({
          where: { id: regionId },
          select: { name: true },
        });
        regionName = region?.name;
      }
      // Fire and forget - don't block response
      populatePlant(plant.id, regionName).catch(console.error);
    }

    const fullPlant = await prisma.plant.findUnique({
      where: { id: plant.id },
      include: {
        availability: {
          include: { supplier: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json(fullPlant, { status: 201 });
  } catch (error) {
    console.error("POST /api/plants error:", error);
    return NextResponse.json(
      { error: "Failed to create plant" },
      { status: 500 }
    );
  }
}
