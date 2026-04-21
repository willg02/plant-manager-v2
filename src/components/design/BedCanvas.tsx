"use client";

import { useRef, useState, useMemo } from "react";
import type { BedVertex, SunOrientation } from "@/lib/design/types";

interface BedCanvasProps {
  polygon: BedVertex[];
  onChange: (polygon: BedVertex[]) => void;
  sunOrientation?: SunOrientation;
  editable?: boolean;
  height?: number;
}

// SVG uses a Y-up world (feet), but SVG Y is down — we flip via a transform
// on the inner group so positive y in data maps to "north" visually.

const PAD_FT = 2; // feet of padding around the polygon in the viewport

function computeViewBox(poly: BedVertex[]) {
  if (poly.length === 0) return { x: -5, y: -5, w: 10, h: 10 };
  const xs = poly.map((p) => p.x);
  const ys = poly.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const w = maxX - minX + PAD_FT * 2;
  const h = maxY - minY + PAD_FT * 2;
  return { x: minX - PAD_FT, y: minY - PAD_FT, w, h };
}

function midpoint(a: BedVertex, b: BedVertex): BedVertex {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function BedCanvas({
  polygon,
  onChange,
  sunOrientation = "S",
  editable = true,
  height = 360,
}: BedCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const viewBox = useMemo(() => computeViewBox(polygon), [polygon]);

  const polyPoints = useMemo(
    () => polygon.map((v) => `${v.x},${-v.y}`).join(" "),
    [polygon]
  );

  // Screen pixel → feet (via inverse of current CTM)
  function screenToFeet(clientX: number, clientY: number): BedVertex | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = pt.matrixTransform(ctm.inverse());
    // We flipped Y in the polygon rendering, so screen Y → -y in world
    return { x: p.x, y: -p.y };
  }

  function onVertexPointerDown(e: React.PointerEvent<SVGCircleElement>, i: number) {
    if (!editable) return;
    e.preventDefault();
    (e.target as SVGCircleElement).setPointerCapture(e.pointerId);
    setDraggingIndex(i);
  }

  function onVertexPointerMove(e: React.PointerEvent<SVGCircleElement>) {
    if (draggingIndex === null) return;
    const pt = screenToFeet(e.clientX, e.clientY);
    if (!pt) return;
    const next = polygon.map((v, i) =>
      i === draggingIndex ? { x: Math.round(pt.x * 10) / 10, y: Math.round(pt.y * 10) / 10 } : v
    );
    onChange(next);
  }

  function onVertexPointerUp(e: React.PointerEvent<SVGCircleElement>) {
    if (draggingIndex === null) return;
    (e.target as SVGCircleElement).releasePointerCapture(e.pointerId);
    setDraggingIndex(null);
  }

  function handleMidpointClick(edgeIndex: number) {
    if (!editable) return;
    const a = polygon[edgeIndex];
    const b = polygon[(edgeIndex + 1) % polygon.length];
    const mid = midpoint(a, b);
    const next = [...polygon];
    next.splice(edgeIndex + 1, 0, { x: Math.round(mid.x * 10) / 10, y: Math.round(mid.y * 10) / 10 });
    onChange(next);
  }

  function handleVertexClick(e: React.MouseEvent<SVGCircleElement>, i: number) {
    if (!editable) return;
    if (!e.shiftKey) return; // Shift-click to delete
    if (polygon.length <= 3) return; // must keep at least a triangle
    const next = polygon.filter((_, idx) => idx !== i);
    onChange(next);
  }

  const arrowRotation = { N: 0, E: 90, S: 180, W: 270 }[sunOrientation];

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted/30" style={{ height }}>
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${-viewBox.y - viewBox.h} ${viewBox.w} ${viewBox.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full touch-none"
      >
        {/* Grid: 1ft spacing */}
        <defs>
          <pattern id="grid-ft" width="1" height="1" patternUnits="userSpaceOnUse">
            <path d="M 1 0 L 0 0 0 1" fill="none" stroke="currentColor" strokeWidth="0.015" className="text-border" opacity="0.4" />
          </pattern>
        </defs>
        <rect
          x={viewBox.x}
          y={-viewBox.y - viewBox.h}
          width={viewBox.w}
          height={viewBox.h}
          fill="url(#grid-ft)"
        />

        {/* Bed polygon */}
        <polygon
          points={polyPoints}
          fill="currentColor"
          className="text-primary/15"
          stroke="currentColor"
          strokeWidth="0.08"
        />

        {/* Edge midpoints (add vertex) */}
        {editable &&
          polygon.map((v, i) => {
            const next = polygon[(i + 1) % polygon.length];
            const m = midpoint(v, next);
            return (
              <circle
                key={`mid-${i}`}
                cx={m.x}
                cy={-m.y}
                r={0.15}
                fill="white"
                stroke="currentColor"
                strokeWidth="0.04"
                className="cursor-crosshair text-muted-foreground opacity-60 hover:opacity-100"
                onClick={() => handleMidpointClick(i)}
              />
            );
          })}

        {/* Vertices */}
        {polygon.map((v, i) => (
          <circle
            key={`v-${i}`}
            cx={v.x}
            cy={-v.y}
            r={0.22}
            fill="white"
            stroke="currentColor"
            strokeWidth="0.08"
            className={`${
              editable ? "cursor-grab text-primary hover:text-primary/70 active:cursor-grabbing" : "text-primary"
            }`}
            onPointerDown={(e) => onVertexPointerDown(e, i)}
            onPointerMove={onVertexPointerMove}
            onPointerUp={onVertexPointerUp}
            onClick={(e) => handleVertexClick(e, i)}
          />
        ))}
      </svg>

      {/* Overlay: scale bar */}
      <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded bg-background/80 px-2 py-1 text-[10px] font-medium text-foreground shadow">
        <div className="h-1 w-6 border border-foreground/60 bg-foreground/10" />
        <span>{scaleBarFeet(viewBox.w)} ft</span>
      </div>

      {/* Overlay: N arrow */}
      <div className="pointer-events-none absolute right-2 top-2 flex flex-col items-center rounded bg-background/80 px-2 py-1 text-[10px] font-semibold text-foreground shadow">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          style={{ transform: `rotate(${arrowRotation}deg)` }}
        >
          <path d="M12 2 L16 12 L12 10 L8 12 Z" fill="currentColor" />
        </svg>
        <span className="leading-none">N</span>
      </div>

      {/* Hint */}
      {editable && (
        <div className="pointer-events-none absolute bottom-2 right-2 max-w-[60%] text-right text-[10px] text-muted-foreground">
          Drag vertices to reshape. Click a midpoint to add one. Shift-click to delete.
        </div>
      )}
    </div>
  );
}

function scaleBarFeet(viewWidthFt: number): number {
  // Pick a "nice" scale bar length that fits in ~6ft of SVG space
  const candidates = [1, 2, 5, 10, 20, 50];
  return candidates.find((c) => c <= viewWidthFt / 3) ?? 1;
}
