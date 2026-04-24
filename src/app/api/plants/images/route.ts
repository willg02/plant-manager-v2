import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/plants/images?ids=id1,id2,...
// Returns { imageMap: { [plantId]: imageUrl | null } }
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];

  if (ids.length === 0) {
    return NextResponse.json({ imageMap: {} });
  }

  const plants = await prisma.plant.findMany({
    where: { id: { in: ids.slice(0, 50) } }, // cap to prevent abuse
    select: { id: true, imageUrl: true },
  });

  const imageMap: Record<string, string | null> = {};
  for (const p of plants) {
    imageMap[p.id] = p.imageUrl;
  }

  return NextResponse.json({ imageMap });
}
