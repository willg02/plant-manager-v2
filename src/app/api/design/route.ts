import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const designs = await prisma.design.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      regionId: true,
      status: true,
      bedImageUrl: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ designs });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { regionId, name } = body as { regionId?: string; name?: string };

  if (!regionId) {
    return NextResponse.json({ error: "regionId is required" }, { status: 400 });
  }

  const region = await prisma.region.findUnique({ where: { id: regionId } });
  if (!region) {
    return NextResponse.json({ error: "Region not found" }, { status: 404 });
  }

  const design = await prisma.design.create({
    data: {
      userId,
      regionId,
      name: name?.trim() || "Untitled design",
    },
  });

  return NextResponse.json({ design }, { status: 201 });
}
