/**
 * Generates a hand-sketched garden layout as an SVG data-URL using rough.js
 * generator API (no DOM / native canvas required — pure Node.js).
 */

import rough from "roughjs";
import type { DesignPlan, DesignPlant } from "./design-plan-pdf";

// ── Palette ──────────────────────────────────────────────────────────────────

const PAPER     = "#faf7f2";
const INK       = "#2a2a28";
const INK_LIGHT = "#6b6960";
const BORDER_CLR = "#d8d2c4";

const FILL_PALETTE = [
  "rgba(74,107,90,0.22)",
  "rgba(201,168,76,0.22)",
  "rgba(199,92,58,0.22)",
  "rgba(100,130,180,0.22)",
  "rgba(160,100,180,0.22)",
  "rgba(80,160,120,0.22)",
  "rgba(200,160,80,0.22)",
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

// ── Layout helpers ───────────────────────────────────────────────────────────

interface PlantCircle {
  plant: DesignPlant;
  cx: number;
  cy: number;
  r: number;
  fillColor: string;
  strokeColor: string;
  abbrev: string;
  colorIdx: number;
}

function abbreviate(name: string): string {
  return name
    .split(/[\s\-]+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 4);
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
  // Deterministic "random" — seeded by index so PDFs look consistent
  let seed = 42;
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };

  for (const zone of zones) {
    const expanded: Array<{ plant: DesignPlant; plantIdx: number }> = [];
    for (const p of zone.list) {
      const plantIdx = plants.indexOf(plants.find((pp) => pp.name === p.name) ?? p);
      const qty = Math.min(p.quantity, 6);
      for (let i = 0; i < qty; i++) expanded.push({ plant: p, plantIdx });
    }
    if (expanded.length === 0) continue;

    const cy    = bedY + bedH * zone.yFrac;
    const space = bedW / (expanded.length + 1);
    const r     = Math.min(space * 0.38, bedH * 0.17);

    for (let i = 0; i < expanded.length; i++) {
      const { plant, plantIdx } = expanded[i];
      const ci = plantIdx % FILL_PALETTE.length;
      circles.push({
        plant,
        cx: bedX + space * (i + 1) + (rand() - 0.5) * space * 0.18,
        cy: cy + (rand() - 0.5) * bedH * 0.07,
        r: r * (0.85 + rand() * 0.3),
        fillColor: FILL_PALETTE[ci],
        strokeColor: STROKE_PALETTE[ci],
        abbrev: abbreviate(plant.name),
        colorIdx: ci,
      });
    }
  }

  // Fallback: simple single row
  if (circles.length === 0) {
    let ci = 0;
    for (const p of plants) {
      const qty   = Math.min(p.quantity, 5);
      const space = bedW / (qty + 1);
      for (let i = 0; i < qty; i++) {
        circles.push({
          plant: p,
          cx: bedX + space * (i + 1),
          cy: bedY + bedH * 0.5,
          r:  Math.min(space, bedH) * 0.32,
          fillColor:   FILL_PALETTE[ci % FILL_PALETTE.length],
          strokeColor: STROKE_PALETTE[ci % STROKE_PALETTE.length],
          abbrev: abbreviate(p.name),
          colorIdx: ci % FILL_PALETTE.length,
        });
      }
      ci++;
    }
  }

  return circles;
}

// ── SVG path builder from rough drawables ───────────────────────────────────

function drawableToSvgPaths(
  drawable: ReturnType<ReturnType<typeof rough.generator>["rectangle"]>
): string {
  const gen   = rough.generator();
  const paths = gen.toPaths(drawable);
  return paths
    .map(({ d, stroke, fill, strokeWidth }) => {
      const strokeAttr = stroke && stroke !== "none" ? `stroke="${stroke}"` : `stroke="none"`;
      const fillAttr   = fill   && fill   !== "none" ? `fill="${fill}"`     : `fill="none"`;
      const swAttr     = strokeWidth ? `stroke-width="${strokeWidth}"` : `stroke-width="1"`;
      return `<path d="${d}" ${strokeAttr} ${fillAttr} ${swAttr} stroke-linecap="round" stroke-linejoin="round" />`;
    })
    .join("\n");
}

// ── Main export ──────────────────────────────────────────────────────────────

export function generateSketchLayout(plan: DesignPlan): string {
  const W = 720;
  const H = 300;
  const PAD = 36;
  const gen = rough.generator();

  const bedX = PAD;
  const bedY = PAD + 16;
  const bedW = W - PAD * 2;
  const bedH = H - bedY - PAD - 46;

  const parts: string[] = [];

  // ── Background rect (paper)
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="${PAPER}" />`);

  // ── Subtle grain dots
  let grainSeed = 7;
  const grainRand = () => { grainSeed = (grainSeed * 1664525 + 1013904223) & 0xffffffff; return (grainSeed >>> 0) / 0xffffffff; };
  const grainDots = Array.from({ length: 300 }, () =>
    `<circle cx="${(grainRand() * W).toFixed(1)}" cy="${(grainRand() * H).toFixed(1)}" r="${(grainRand() * 0.7).toFixed(2)}" fill="rgba(0,0,0,0.04)" />`
  ).join("");
  parts.push(grainDots);

  // ── Garden bed (rough rectangle)
  const bed = gen.rectangle(bedX, bedY, bedW, bedH, {
    stroke: INK,
    strokeWidth: 1.8,
    roughness: 1.6,
    fill: "rgba(190,205,185,0.09)",
    fillStyle: "hachure",
    hachureGap: 16,
    hachureAngle: -40,
  });
  parts.push(drawableToSvgPaths(bed));

  // ── Inner mulch texture
  const mulch = gen.rectangle(bedX + 4, bedY + 4, bedW - 8, bedH - 8, {
    stroke: "none",
    roughness: 2.2,
    fill: "rgba(140,110,80,0.05)",
    fillStyle: "cross-hatch",
    hachureGap: 20,
  });
  parts.push(drawableToSvgPaths(mulch));

  // ── Plants
  const circles = layoutPlants(plan.plants, bedX, bedY, bedW, bedH);

  for (const c of circles) {
    const circle = gen.circle(c.cx, c.cy, c.r * 2, {
      stroke: c.strokeColor,
      strokeWidth: 1.5,
      roughness: 1.9,
      fill: c.fillColor,
      fillStyle: "solid",
    });
    parts.push(drawableToSvgPaths(circle));

    // Label
    const fs = Math.max(7, Math.min(c.r * 0.55, 11));
    parts.push(
      `<text x="${c.cx.toFixed(1)}" y="${(c.cy + fs * 0.38).toFixed(1)}" ` +
      `font-size="${fs.toFixed(1)}" font-family="Helvetica, Arial, sans-serif" font-weight="bold" ` +
      `fill="${c.strokeColor}" text-anchor="middle">${c.abbrev}</text>`
    );
  }

  // ── Legend
  const legendY = bedY + bedH + 14;
  const uniquePlants = plan.plants.filter(
    (p, i, arr) => arr.findIndex((pp) => pp.name === p.name) === i
  );
  const itemW = Math.min(120, (W - PAD * 2) / Math.max(uniquePlants.length, 1));

  for (let i = 0; i < uniquePlants.length; i++) {
    const lx = PAD + i * itemW;
    const dot = gen.circle(lx + 7, legendY + 5, 10, {
      stroke: STROKE_PALETTE[i % STROKE_PALETTE.length],
      strokeWidth: 1,
      roughness: 1.2,
      fill: FILL_PALETTE[i % FILL_PALETTE.length],
      fillStyle: "solid",
    });
    parts.push(drawableToSvgPaths(dot));

    const label = uniquePlants[i].name.length > 14
      ? uniquePlants[i].name.slice(0, 13) + "…"
      : uniquePlants[i].name;
    parts.push(
      `<text x="${(lx + 16).toFixed(1)}" y="${(legendY + 9).toFixed(1)}" ` +
      `font-size="8.5" font-family="Helvetica, Arial, sans-serif" fill="${INK}">${label}</text>`
    );
  }

  // ── Scale bar (bottom right)
  const scaleX = W - PAD - 80;
  const scaleY = legendY + 4;
  const scaleBar = gen.line(scaleX, scaleY, scaleX + 60, scaleY, { stroke: INK_LIGHT, strokeWidth: 1, roughness: 0.7 });
  const tickL    = gen.line(scaleX, scaleY - 4, scaleX, scaleY + 4,       { stroke: INK_LIGHT, strokeWidth: 1, roughness: 0.5 });
  const tickR    = gen.line(scaleX + 60, scaleY - 4, scaleX + 60, scaleY + 4, { stroke: INK_LIGHT, strokeWidth: 1, roughness: 0.5 });
  parts.push(drawableToSvgPaths(scaleBar), drawableToSvgPaths(tickL), drawableToSvgPaths(tickR));
  parts.push(
    `<text x="${(scaleX + 30).toFixed(1)}" y="${(scaleY + 12).toFixed(1)}" ` +
    `font-size="7.5" font-family="Helvetica, Arial, sans-serif" fill="${INK_LIGHT}" text-anchor="middle">scale approx.</text>`
  );

  // ── Annotation
  parts.push(
    `<text x="${(bedX + 4).toFixed(1)}" y="${(bedY - 6).toFixed(1)}" ` +
    `font-size="8.5" font-family="Georgia, serif" font-style="italic" fill="${INK_LIGHT}">planting plan — not to scale</text>`
  );

  // ── Compose SVG
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    ...parts,
    `</svg>`,
  ].join("\n");

  // Return as data URL for @react-pdf/renderer <Image>
  const b64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${b64}`;
}
