"use client";

import { useRef, useCallback } from "react";
import type { BedVertex, PlantPlacement, SunOrientation } from "@/lib/design/types";
import { Download, FileText } from "lucide-react";

const PALETTE = [
  "#4ade80", "#60a5fa", "#f97316", "#a855f7", "#f43f5e",
  "#eab308", "#06b6d4", "#ec4899", "#84cc16", "#8b5cf6",
];

const SUN_LABEL: Record<SunOrientation, string> = {
  N: "↑ N (front)",
  S: "↓ S (front)",
  E: "→ E (front)",
  W: "← W (front)",
};

interface LayoutCanvasProps {
  polygon: BedVertex[];
  placements: PlantPlacement[];
  plantNames: Record<string, string>;
  notes?: string;
  sunOrientation: SunOrientation;
}

export function LayoutCanvas({
  polygon,
  placements,
  plantNames,
  notes,
  sunOrientation,
}: LayoutCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const minX = Math.min(...polygon.map((v) => v.x));
  const maxX = Math.max(...polygon.map((v) => v.x));
  const minY = Math.min(...polygon.map((v) => v.y));
  const maxY = Math.max(...polygon.map((v) => v.y));

  const BED_W = 520;
  const BED_H = 320;
  const PAD = 44;

  const scale = Math.min(
    (BED_W - PAD * 2) / Math.max(maxX - minX, 0.1),
    (BED_H - PAD * 2) / Math.max(maxY - minY, 0.1)
  );

  // SVG Y is flipped relative to the polygon (polygon Y=0 is at the bottom)
  const toSvg = (x: number, y: number) => ({
    x: (x - minX) * scale + PAD,
    y: BED_H - ((y - minY) * scale + PAD),
  });

  const uniqueIds = [...new Set(placements.map((p) => p.plantId))];
  const colorMap = Object.fromEntries(uniqueIds.map((id, i) => [id, PALETTE[i % PALETTE.length]]));

  const LEGEND_ROWS = Math.ceil(uniqueIds.length / 3);
  const LEGEND_H = Math.max(LEGEND_ROWS * 22 + 20, 48);
  const SVG_W = BED_W;
  const SVG_H = BED_H + LEGEND_H;

  const polygonPoints = polygon
    .map((v) => {
      const s = toSvg(v.x, v.y);
      return `${s.x.toFixed(1)},${s.y.toFixed(1)}`;
    })
    .join(" ");

  const exportPng = useCallback(() => {
    const el = svgRef.current;
    if (!el) return;
    const serialized = new XMLSerializer().serializeToString(el);
    const svgBlob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const DPR = 2;
      const canvas = document.createElement("canvas");
      canvas.width = SVG_W * DPR;
      canvas.height = SVG_H * DPR;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(DPR, DPR);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = "garden-layout.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(pngUrl), 10000);
      }, "image/png");
    };
    img.src = svgUrl;
  }, [SVG_W, SVG_H]);

  const exportPdf = useCallback(() => {
    const el = svgRef.current;
    if (!el) return;
    const serialized = new XMLSerializer().serializeToString(el);
    const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open("", "_blank");
    if (!win) { window.open(url, "_blank"); return; }
    win.document.write(
      `<!DOCTYPE html><html><head><title>Garden Layout</title>` +
      `<style>body{margin:0;background:#fff;display:flex;justify-content:center;}` +
      `img{max-width:100%;height:auto;}@media print{body{margin:0;}}</style></head>` +
      `<body><img src="${url}" onload="window.print()"></body></html>`
    );
    win.document.close();
  }, []);

  return (
    <div className="space-y-3">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width={SVG_W}
        height={SVG_H}
        className="w-full rounded-lg border border-border bg-white"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Bed fill */}
        <polygon points={polygonPoints} fill="#d1fae5" stroke="#059669" strokeWidth="2" />

        {/* Plant circles */}
        {placements.map((p, i) => {
          const pos = toSvg(p.x, p.y);
          const r = Math.max(p.spreadRadius * scale, 9);
          const color = colorMap[p.plantId] ?? "#aaa";
          const name = plantNames[p.plantId] ?? p.plantId;
          // abbreviate to first letters of each word, up to 3 chars
          const abbr = name
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .slice(0, 3)
            .toUpperCase();
          const fontSize = Math.max(Math.min(r * 0.65, 11), 7);
          return (
            <g key={i}>
              <circle
                cx={pos.x.toFixed(1)}
                cy={pos.y.toFixed(1)}
                r={r.toFixed(1)}
                fill={color}
                fillOpacity="0.55"
                stroke={color}
                strokeWidth="1.5"
              />
              <text
                x={pos.x.toFixed(1)}
                y={(pos.y + fontSize * 0.4).toFixed(1)}
                textAnchor="middle"
                fontSize={fontSize}
                fontFamily="system-ui,sans-serif"
                fontWeight="700"
                fill="#111827"
              >
                {abbr}
              </text>
            </g>
          );
        })}

        {/* Sun orientation */}
        <text
          x={SVG_W - 6}
          y={BED_H - 6}
          textAnchor="end"
          fontSize={10}
          fontFamily="system-ui,sans-serif"
          fill="#6b7280"
        >
          {SUN_LABEL[sunOrientation]}
        </text>

        {/* Scale bar — 1 ft */}
        <line
          x1={PAD}
          y1={BED_H - 10}
          x2={(PAD + scale).toFixed(1)}
          y2={BED_H - 10}
          stroke="#9ca3af"
          strokeWidth="1.5"
        />
        <line x1={PAD} y1={BED_H - 7} x2={PAD} y2={BED_H - 13} stroke="#9ca3af" strokeWidth="1.5" />
        <line
          x1={(PAD + scale).toFixed(1)}
          y1={BED_H - 7}
          x2={(PAD + scale).toFixed(1)}
          y2={BED_H - 13}
          stroke="#9ca3af"
          strokeWidth="1.5"
        />
        <text
          x={(PAD + scale / 2).toFixed(1)}
          y={BED_H - 15}
          textAnchor="middle"
          fontSize={9}
          fontFamily="system-ui,sans-serif"
          fill="#9ca3af"
        >
          1 ft
        </text>

        {/* Legend divider */}
        <line x1={0} y1={BED_H} x2={SVG_W} y2={BED_H} stroke="#e5e7eb" strokeWidth="1" />

        {/* Legend entries */}
        {uniqueIds.map((id, i) => {
          const col = Math.floor(i / LEGEND_ROWS);
          const row = i % LEGEND_ROWS;
          const lx = 10 + col * 172;
          const ly = BED_H + 14 + row * 22;
          const color = colorMap[id] ?? "#aaa";
          const name = plantNames[id] ?? id;
          return (
            <g key={id}>
              <circle cx={lx + 7} cy={ly + 4} r={7} fill={color} fillOpacity="0.7" />
              <text
                x={lx + 18}
                y={ly + 8}
                fontSize={10}
                fontFamily="system-ui,sans-serif"
                fill="#374151"
              >
                {name.length > 22 ? name.slice(0, 21) + "…" : name}
              </text>
            </g>
          );
        })}
      </svg>

      {notes && (
        <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
          {notes}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={exportPng}
          className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Download className="h-3.5 w-3.5" />
          Export PNG
        </button>
        <button
          onClick={exportPdf}
          className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <FileText className="h-3.5 w-3.5" />
          Export PDF
        </button>
      </div>
    </div>
  );
}
