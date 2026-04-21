"use client";

import { useEffect, useState } from "react";
import { BedCanvas } from "./BedCanvas";
import type { BedVertex, SunOrientation } from "@/lib/design/types";
import { Square, Pentagon, ImagePlus, Loader2, X } from "lucide-react";

type ShapeMode = "rectangle" | "freeform" | "upload";

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

  // Upload-mode state
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("design-bedImageUrl");
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [refEdgeDescription, setRefEdgeDescription] = useState("front edge");
  const [refEdgeLength, setRefEdgeLength] = useState("12");
  const [extractingPolygon, setExtractingPolygon] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractNotes, setExtractNotes] = useState<{
    reasoning: string;
    confidence: "high" | "medium" | "low";
  } | null>(null);

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

  async function handleImageFile(file: File) {
    setUploadError(null);
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/design/bed-image", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }
      const data = (await res.json()) as { url: string };
      setUploadedImageUrl(data.url);
      sessionStorage.setItem("design-bedImageUrl", data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  }

  function clearUploadedImage() {
    setUploadedImageUrl(null);
    setExtractNotes(null);
    sessionStorage.removeItem("design-bedImageUrl");
  }

  async function extractPolygon() {
    if (!uploadedImageUrl) return;
    const length = parseFloat(refEdgeLength);
    if (!(length > 0)) {
      setExtractError("Enter a positive reference edge length.");
      return;
    }

    setExtractError(null);
    setExtractingPolygon(true);
    setExtractNotes(null);
    try {
      const res = await fetch("/api/design/extract-bed-polygon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          referenceEdgeDescription: refEdgeDescription.trim() || "reference edge",
          referenceEdgeLengthFeet: length,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Extraction failed" }));
        throw new Error(err.error || "Extraction failed");
      }
      const data = (await res.json()) as {
        vertices: BedVertex[];
        reasoning: string;
        confidence: "high" | "medium" | "low";
      };
      onPolygonChange(data.vertices);
      setExtractNotes({ reasoning: data.reasoning, confidence: data.confidence });
      // Jump to freeform so they can adjust
      setMode("freeform");
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtractingPolygon(false);
    }
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
          <button
            onClick={() => setMode("upload")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              mode === "upload"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <ImagePlus className="h-4 w-4" />
            Upload image
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

        {mode === "upload" && (
          <div className="mt-3 space-y-3">
            {/* File picker */}
            {!uploadedImageUrl && (
              <div>
                <input
                  id="bed-image-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                    e.target.value = "";
                  }}
                />
                <label
                  htmlFor="bed-image-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  {uploadingImage ? "Uploading…" : "Choose image"}
                </label>
                {uploadError && (
                  <p className="mt-1 text-xs text-destructive">{uploadError}</p>
                )}
              </div>
            )}

            {/* Image preview */}
            {uploadedImageUrl && (
              <div className="relative w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadedImageUrl}
                  alt="Bed reference"
                  className="max-h-48 rounded border border-border object-contain"
                />
                <button
                  onClick={clearUploadedImage}
                  aria-label="Remove image"
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Reference edge inputs + Extract */}
            {uploadedImageUrl && (
              <div className="space-y-2">
                <label className="flex flex-col text-xs text-muted-foreground">
                  Reference edge description
                  <input
                    type="text"
                    value={refEdgeDescription}
                    onChange={(e) => setRefEdgeDescription(e.target.value)}
                    placeholder="e.g. front edge"
                    className="mt-1 rounded border border-border bg-card px-2 py-1 text-sm text-foreground"
                  />
                </label>
                <label className="flex flex-col text-xs text-muted-foreground">
                  Reference edge length (ft)
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={refEdgeLength}
                    onChange={(e) => setRefEdgeLength(e.target.value)}
                    className="mt-1 w-28 rounded border border-border bg-card px-2 py-1 text-sm text-foreground"
                  />
                </label>
                <button
                  onClick={extractPolygon}
                  disabled={extractingPolygon}
                  className="flex items-center gap-2 rounded border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/20 disabled:opacity-50"
                >
                  {extractingPolygon && <Loader2 className="h-4 w-4 animate-spin" />}
                  {extractingPolygon ? "Extracting…" : "Extract polygon"}
                </button>

                {extractError && (
                  <p className="text-xs text-destructive">{extractError}</p>
                )}

                {extractNotes && (
                  <div className="rounded border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
                    <span
                      className={`mr-1 font-semibold ${
                        extractNotes.confidence === "high"
                          ? "text-green-600"
                          : extractNotes.confidence === "medium"
                            ? "text-yellow-600"
                            : "text-destructive"
                      }`}
                    >
                      {extractNotes.confidence.charAt(0).toUpperCase() +
                        extractNotes.confidence.slice(1)}{" "}
                      confidence.
                    </span>
                    {extractNotes.reasoning}
                  </div>
                )}
              </div>
            )}
          </div>
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
