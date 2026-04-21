import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDimensionToFeet } from "@/lib/plants/parse-dimensions";

export async function POST() {
  const plants = await prisma.plant.findMany({
    where: {
      OR: [{ matureHeight: { not: null } }, { matureWidth: { not: null } }],
    },
    select: { id: true, matureHeight: true, matureWidth: true },
  });

  let updated = 0;
  let unparseable = 0;
  const failures: Array<{ id: string; height: string | null; width: string | null }> = [];

  for (const p of plants) {
    const h = parseDimensionToFeet(p.matureHeight);
    const w = parseDimensionToFeet(p.matureWidth);

    if (h === null && h === null && p.matureHeight) unparseable++;
    if (h === null && p.matureHeight) {
      failures.push({ id: p.id, height: p.matureHeight, width: p.matureWidth });
    }

    await prisma.plant.update({
      where: { id: p.id },
      data: { matureHeightFeet: h, matureWidthFeet: w },
    });
    updated++;
  }

  return NextResponse.json({
    scanned: plants.length,
    updated,
    unparseable,
    failures: failures.slice(0, 20), // cap the response
  });
}
