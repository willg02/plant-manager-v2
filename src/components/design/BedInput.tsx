"use client";

import { useEffect, useState } from "react";
import { BedCanvas } from "./BedCanvas";
import type { BedVertex, SunOrientation } from "@/lib/design/types";
import { Square, Pentagon } from "lucide-react";

type ShapeMode = "rectangle" | "freeform";

interface BedInputProps {
  polygon: BedVertex[] | null;
  onPolygonChange: (polygon: BedVertex[]) => void;
  sunOrientation: SunOrientation;
  onSunOrientationChange: (o: SunOrientation) => void;
}

function rectanglePolygon(width: number, depth: number): BedVertex[] {
  // Origin at bottom-left, counter-clockwise
  return [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: depth },
    { x: 0, y: depth },
  ];
}

function polygonArea(poly: BedVertex[]): number {
  // Shoelace formula
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

const SUN_OPTIONS: { value: SunOrientation; label: string }[] = [
  { value: "N", label: "North" },
  { value: "E", label: "East" },
  { value: "S", label: "South" },
  { value: "W", label: "West" },
];

export function BedInput({
  polygon,
  onPolygonChange,
  sunOrientation,
  onSunOrientationChange,
}: BedInputProps) {
  const [mode, setMode] = useState<ShapeMode>(() => {
    if (typeof window === "undefined") return "rectangle";
    return (sessionStorage.getItem("design-bed-mode") as ShapeMode) || "rectangle";
  });

  const [rectWidth, setRectWidth] = useState<string>("12");
  const [rectDepth, setRectDepth] = useState<string>("6");

  useEffect(() => {
    sessionStorage.setItem("design-bed-mode", mode);
  }, [mode]);

  // Initialize polygon on first mount if none exists
  useEffect(() => {
    if (!polygon || polygon.length < 3) {
      const w = parseFloat(rectWidth) || 12;
      const d = parseFloat(rectDepth) || 6;
      onPolygonChange(rectanglePolygon(w, d));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyRectangle() {
    const w = parseFloat(rectWidth);
    const d = parseFloat(rectDepth);
    if (!(w > 0 && d > 0)) return;
    onPolygonChange(rectanglePolygon(w, d));
  }

  const area = polygon && polygon.length >= 3 ? polygonArea(polygon) : 0;

  return (
    <div className="space-y-5">
      {/* Step 1: Shape mode */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">1. Bed shape</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("rectangle")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              mode === "rectangle"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <Square className="h-4 w-4" />
            Rectangle
          </button>
          <button
            onClick={() => setMode("freeform")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              mode === "freeform"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <Pentagon className="h-4 w-4" />
            Freeform polygon
          </button>
        </div>

        {mode === "rectangle" && (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="flex flex-col text-xs text-muted-foreground">
              Width (ft)
              <input
                type="number"
                min="1"
                step="0.5"
                value={rectWidth}
                onChange={(e) => setRectWidth(e.target.value)}
                className="mt-1 w-24 rounded border border-border bg-card px-2 py-1 text-sm text-foreground"
              />
            </label>
            <label className="flex flex-col text-xs text-muted-foreground">
              Depth (ft)
              <input
                type="number"
                min="1"
                step="0.5"
                value={rectDepth}
                onChange={(e) => setRectDepth(e.target.value)}
                className="mt-1 w-24 rounded border border-border bg-card px-2 py-1 text-sm text-foreground"
              />
            </label>
            <button
              onClick={applyRectangle}
              className="rounded border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Apply
            </button>
          </div>
        )}

        {mode === "freeform" && (
          <p className="mt-2 text-xs text-muted-foreground">
            Drag any vertex to reshape. Click the small dot at the midpoint of any edge to add a new
            vertex. Shift-click a vertex to remove it (minimum 3).
          </p>
        )}
      </section>

      {/* Step 2: Sun orientation */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          2. Which way does the front of the bed face?
        </h3>
        <p className="mb-2 text-xs text-muted-foreground">
          Used to work out sun exposure for each planting position.
        </p>
        <div className="flex flex-wrap gap-2">
          {SUN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSunOrientationChange(opt.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                sunOrientation === opt.value
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Step 3: Preview */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">3. Preview</h3>
          {area > 0 && (
            <span className="text-xs text-muted-foreground">
              {area.toFixed(1)} sq ft · {polygon?.length ?? 0} vertices
            </span>
          )}
        </div>
        <BedCanvas
          polygon={polygon ?? []}
          onChange={onPolygonChange}
          sunOrientation={sunOrientation}
          editable={true}
        />
      </section>
    </div>
  );
}
