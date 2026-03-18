"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PopulateAllButtonProps {
  pendingPlantIds: string[];
}

export function PopulateAllButton({ pendingPlantIds }: PopulateAllButtonProps) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState(0);
  const total = pendingPlantIds.length;

  const handlePopulateAll = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setErrors(0);

    for (let i = 0; i < pendingPlantIds.length; i++) {
      try {
        const res = await fetch("/api/ai/populate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plantId: pendingPlantIds[i] }),
        });

        if (!res.ok) {
          setErrors((prev) => prev + 1);
        }
      } catch {
        setErrors((prev) => prev + 1);
      }

      setProgress(i + 1);
    }

    setIsRunning(false);
    router.refresh();
  }, [pendingPlantIds, router]);

  if (isRunning) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-muted-foreground">
          Populating {progress} / {total}
          {errors > 0 && (
            <span className="text-red-500 ml-2">({errors} errors)</span>
          )}
        </div>
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <Button variant="outline" onClick={handlePopulateAll}>
      Populate All ({total})
    </Button>
  );
}
