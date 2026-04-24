"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";

interface PopulateImagesButtonProps {
  plantIds: string[]; // plants that currently have no imageUrl
}

export function PopulateImagesButton({ plantIds }: PopulateImagesButtonProps) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [found, setFound] = useState(0);
  const [errors, setErrors] = useState(0);
  const abortRef = useRef(false);
  const total = plantIds.length;

  const fetchSingle = useCallback(async (plantId: string): Promise<"found" | "not_found" | "error"> => {
    try {
      const res = await fetch("/api/ai/populate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantId }),
      });
      if (!res.ok) return "error";
      const data = await res.json();
      return data.imageUrl ? "found" : "not_found";
    } catch {
      return "error";
    }
  }, []);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setFound(0);
    setErrors(0);
    abortRef.current = false;

    for (let i = 0; i < plantIds.length; i++) {
      if (abortRef.current) break;

      const result = await fetchSingle(plantIds[i]);
      if (result === "found") setFound((n) => n + 1);
      if (result === "error") setErrors((n) => n + 1);
      setProgress(i + 1);

      // Respect iNaturalist rate limits (~60 req/min)
      await new Promise((r) => setTimeout(r, 1100));
    }

    setIsRunning(false);
    router.refresh();
  }, [plantIds, router, fetchSingle]);

  const handleStop = useCallback(() => {
    abortRef.current = true;
    setIsRunning(false);
    router.refresh();
  }, [router]);

  if (isRunning) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-muted-foreground">
          Images {progress}/{total}
          <span className="text-green-600 ml-2">+{found}</span>
          {errors > 0 && <span className="text-red-500 ml-1">({errors} errors)</span>}
        </div>
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleStop}>
          Stop
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" onClick={handleRun}>
      <ImageIcon className="size-4 mr-1" />
      Fetch Images ({total})
    </Button>
  );
}
