import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

type RouteParams = { params: Promise<{ id: string }> };

async function loadOwnedDesign(id: string, userId: string) {
  const design = await prisma.design.findUnique({ where: { id } });
  if (!design) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (design.userId !== userId) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { design };
}

export async function GET(_: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { design, error } = await loadOwnedDesign(id, userId);
  if (error) return error;

  return NextResponse.json({ design });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { error } = await loadOwnedDesign(id, userId);
  if (error) return error;

  const body = (await request.json()) as Partial<{
    name: string;
    bedPolygon: unknown;
    bedImageUrl: string | null;
    sunOrientation: string | null;
    shortlistPlantIds: string[];
    messages: unknown;
    layout: unknown;
    status: "draft" | "generated";
  }>;

  const data: Prisma.DesignUpdateInput = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.bedPolygon !== undefined) data.bedPolygon = body.bedPolygon as Prisma.InputJsonValue;
  if (body.bedImageUrl !== undefined) data.bedImageUrl = body.bedImageUrl;
  if (body.sunOrientation !== undefined) data.sunOrientation = body.sunOrientation;
  if (body.shortlistPlantIds !== undefined) data.shortlistPlantIds = body.shortlistPlantIds;
  if (body.messages !== undefined) data.messages = body.messages as Prisma.InputJsonValue;
  if (body.layout !== undefined) data.layout = body.layout as Prisma.InputJsonValue;
  if (body.status !== undefined) data.status = body.status;

  const updated = await prisma.design.update({ where: { id }, data });
  return NextResponse.json({ design: updated });
}

export async function DELETE(_: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { error } = await loadOwnedDesign(id, userId);
  if (error) return error;

  await prisma.design.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
