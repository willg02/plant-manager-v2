/**
 * Generates a hand-sketched garden layout as a react-pdf <Svg> element
 * using rough.js generator API (pure Node.js, no native modules).
 */

import React from "react";
import { Svg, Path, Rect, Line, Text as SvgText } from "@react-pdf/renderer";
import rough from "roughjs";
import type { DesignPlan, DesignPlant } from "./design-plan-pdf";

// ── Palette ──────────────────────────────────────────────────────────────────

const PAPER      = "#faf7f2";
const INK        = "#2a2a28";
const INK_LIGHT  = "#6b6960";

const FILL_PALETTE = [
  "rgba(74,107,90,0.30)",
  "rgba(201,168,76,0.30)",
  "rgba(199,92,58,0.30)",
  "rgba(100,130,180,0.30)",
  "rgba(160,100,180,0.30)",
  "rgba(80,160,120,0.30)",
  "rgba(200,160,80,0.30)",
];

const STROKE_PALETTE = [
  "#4a6b5a",
  "#b8952a",
  "#c75c3a",
  "#5a7ab8",
  "#9060b0",
  "#3a9060",
  "#b89020",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function abbreviate(name: string): string {
  return name
    .split(/[\s\-]+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 4);
}

interface PlantCircle {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke: string;
  abbrev: string;
  labelColor: string;
}

function layoutPlants(
  plants: DesignPlant[],
  bedX: number,
  bedY: number,
  bedW: number,
  bedH: number
): PlantCircle[] {
  const front = plants.filter((p) =>
    /front|edge|border|ground/i.test(p.role + " " + p.placement)
  );
  const back = plants.filter((p) =>
    /back|rear|tall|specimen|anchor/i.test(p.role + " " + p.placement)
  );
  const mid = plants.filter((p) => !front.includes(p) && !back.includes(p));

  const zones = [
    { list: back,  yFrac: 0.22 },
    { list: mid,   yFrac: 0.52 },
    { list: front, yFrac: 0.80 },
  ];

  const circles: PlantCircle[] = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };

  for (const zone of zones) {
    const expanded: Array<{ plant: DesignPlant; plantIdx: number }> = [];
    for (const p of zone.list) {
      const plantIdx = plants.findIndex((pp) => pp.name === p.name);
      const qty = Math.min(p.quantity, 6);
      for (let i = 0; i < qty; i++) expanded.push({ plant: p, plantIdx });
    }
    if (expanded.length === 0) continue;

    const space = bedW / (expanded.length + 1);
    const r = Math.min(space * 0.38, bedH * 0.17);

    for (let i = 0; i < expanded.length; i++) {
      const { plant, plantIdx } = expanded[i];
      const ci = (plantIdx < 0 ? 0 : plantIdx) % FILL_PALETTE.length;
      circles.push({
        cx: bedX + space * (i + 1) + (rand() - 0.5) * space * 0.18,
        cy: bedY + bedH * zone.yFrac + (rand() - 0.5) * bedH * 0.07,
        r:  r * (0.85 + rand() * 0.3),
        fill: FILL_PALETTE[ci],
        stroke: STROKE_PALETTE[ci],
        abbrev: abbreviate(plant.name),
        labelColor: STROKE_PALETTE[ci],
      });
    }
  }

  // Fallback single row
  if (circles.length === 0) {
    let ci = 0;
    for (const p of plants) {
      const qty   = Math.min(p.quantity, 5);
      const space = bedW / (qty + 1);
      for (let i = 0; i < qty; i++) {
        circles.push({
          cx: bedX + space * (i + 1),
          cy: bedY + bedH * 0.5,
          r:  Math.min(space, bedH) * 0.32,
          fill: FILL_PALETTE[ci % FILL_PALETTE.length],
          stroke: STROKE_PALETTE[ci % STROKE_PALETTE.length],
          abbrev: abbreviate(p.name),
          labelColor: STROKE_PALETTE[ci % STROKE_PALETTE.length],
        });
      }
      ci++;
    }
  }

  return circles;
}

/** Convert rough.js drawable → array of {d, stroke, fill, strokeWidth} */
function toPaths(drawable: ReturnType<ReturnType<typeof rough.generator>["rectangle"]>) {
  const gen = rough.generator();
  return gen.toPaths(drawable);
}

// ── Main export ──────────────────────────────────────────────────────────────

export function SketchLayout({ plan }: { plan: DesignPlan }): React.ReactElement {
  const W   = 500;
  const H   = 210;
  const PAD = 24;
  const gen = rough.generator();

  const bedX = PAD;
  const bedY = PAD + 12;
  const bedW = W - PAD * 2;
  const bedH = H - bedY - PAD - 36;

  const pathEls: React.ReactElement[] = [];
  let key = 0;

  const addPaths = (
    drawable: ReturnType<typeof gen.rectangle>,
    overrides?: { fill?: string; stroke?: string }
  ) => {
    for (const p of toPaths(drawable)) {
      pathEls.push(
        <Path
          key={key++}
          d={p.d}
          stroke={overrides?.stroke ?? (p.stroke === "none" ? "none" : (p.stroke as string) ?? "none")}
          fill={overrides?.fill ?? (p.fill === "none" ? "none" : (p.fill as string) ?? "none")}
          strokeWidth={p.strokeWidth ?? 1}
        />
      );
    }
  };

  // ── Garden bed
  addPaths(
    gen.rectangle(bedX, bedY, bedW, bedH, {
      stroke: INK,
      strokeWidth: 1.6,
      roughness: 1.6,
      fill: "rgba(190,205,185,0.12)",
      fillStyle: "hachure",
      hachureGap: 14,
      hachureAngle: -40,
    })
  );

  // ── Mulch cross-hatch overlay
  addPaths(
    gen.rectangle(bedX + 3, bedY + 3, bedW - 6, bedH - 6, {
      stroke: "none",
      roughness: 2,
      fill: "rgba(140,110,80,0.06)",
      fillStyle: "cross-hatch",
      hachureGap: 18,
    })
  );

  // ── Plant circles
  const circles = layoutPlants(plan.plants, bedX, bedY, bedW, bedH);
  for (const c of circles) {
    addPaths(
      gen.circle(c.cx, c.cy, c.r * 2, {
        stroke: c.stroke,
        strokeWidth: 1.4,
        roughness: 1.9,
        fill: c.fill,
        fillStyle: "solid",
      })
    );
    // Label
    const fs = Math.max(6, Math.min(c.r * 0.5, 9));
    pathEls.push(
      <SvgText
        key={key++}
        x={c.cx}
        y={c.cy + fs * 0.38}
        style={{ fontSize: fs, fontWeight: "bold", fill: c.labelColor, textAnchor: "middle" }}
      >
        {c.abbrev}
      </SvgText>
    );
  }

  // ── Legend
  const legendY = bedY + bedH + 10;
  const uniquePlants = plan.plants.filter(
    (p, i, arr) => arr.findIndex((pp) => pp.name === p.name) === i
  );
  const itemW = Math.min(90, (W - PAD * 2) / Math.max(uniquePlants.length, 1));

  for (let i = 0; i < uniquePlants.length; i++) {
    const lx  = PAD + i * itemW;
    const ci  = i % FILL_PALETTE.length;
    addPaths(
      gen.circle(lx + 5, legendY + 4, 8, {
        stroke: STROKE_PALETTE[ci],
        strokeWidth: 1,
        roughness: 1.2,
        fill: FILL_PALETTE[ci],
        fillStyle: "solid",
      })
    );
    const label = uniquePlants[i].name.length > 12
      ? uniquePlants[i].name.slice(0, 11) + "…"
      : uniquePlants[i].name;
    pathEls.push(
      <SvgText key={key++} x={lx + 13} y={legendY + 8} style={{ fontSize: 7, fill: INK }}>
        {label}
      </SvgText>
    );
  }

  // ── Scale bar
  const sx = W - PAD - 65;
  const sy = legendY + 4;
  addPaths(gen.line(sx, sy, sx + 50, sy, { stroke: INK_LIGHT, strokeWidth: 1, roughness: 0.8 }));
  addPaths(gen.line(sx, sy - 3, sx, sy + 3,       { stroke: INK_LIGHT, strokeWidth: 1, roughness: 0.5 }));
  addPaths(gen.line(sx + 50, sy - 3, sx + 50, sy + 3, { stroke: INK_LIGHT, strokeWidth: 1, roughness: 0.5 }));
  pathEls.push(
    <SvgText key={key++} x={sx + 25} y={sy + 11} style={{ fontSize: 6.5, fill: INK_LIGHT, textAnchor: "middle" }}>
      scale approx.
    </SvgText>
  );

  // ── Annotation
  pathEls.push(
    <SvgText key={key++} x={bedX + 2} y={bedY - 4} style={{ fontSize: 7, fill: INK_LIGHT, fontStyle: "italic" }}>
      planting plan — not to scale
    </SvgText>
  );

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H} fill={PAPER} />
      {pathEls}
    </Svg>
  );
}
