"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PopulateAllButtonProps {
  pendingPlantIds: string[];
}

export function PopulateAllButton({ pendingPlantIds }: PopulateAllButtonProps) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState(0);
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const total = pendingPlantIds.length;

  // Refs to survive across renders and visibility changes
  const pausedRef = useRef(false);
  const abortRef = useRef(false);

  // Pause processing when tab goes to background, resume when visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        pausedRef.current = true;
        setIsPaused(true);
      } else {
        pausedRef.current = false;
        setIsPaused(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const waitWhilePaused = useCallback(async () => {
    while (pausedRef.current && !abortRef.current) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }, []);

  const populateSingle = useCallback(
    async (plantId: string, retries = 2): Promise<boolean> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const res = await fetch("/api/ai/populate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plantId }),
          });

          if (res.ok) return true;

          // If rate limited, wait and retry
          if (res.status === 429 && attempt < retries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 2000 * (attempt + 1))
            );
            continue;
          }
        } catch {
          if (attempt < retries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * (attempt + 1))
            );
            continue;
          }
        }
      }
      return false;
    },
    []
  );

  const handlePopulateAll = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setErrors(0);
    setFailedIds([]);
    abortRef.current = false;

    for (let i = 0; i < pendingPlantIds.length; i++) {
      if (abortRef.current) break;

      // Wait if tab is in background
      await waitWhilePaused();
      if (abortRef.current) break;

      const success = await populateSingle(pendingPlantIds[i]);

      if (!success) {
        setErrors((prev) => prev + 1);
        setFailedIds((prev) => [...prev, pendingPlantIds[i]]);
      }

      setProgress(i + 1);

      // Small delay between requests to be gentle on the API
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsRunning(false);
    router.refresh();
  }, [pendingPlantIds, router, populateSingle, waitWhilePaused]);

  const handleRetryFailed = useCallback(async () => {
    if (failedIds.length === 0) return;

    setIsRunning(true);
    const toRetry = [...failedIds];
    setFailedIds([]);
    setProgress(0);
    setErrors(0);
    abortRef.current = false;

    const newTotal = toRetry.length;

    for (let i = 0; i < newTotal; i++) {
      if (abortRef.current) break;
      await waitWhilePaused();
      if (abortRef.current) break;

      const success = await populateSingle(toRetry[i]);

      if (!success) {
        setErrors((prev) => prev + 1);
        setFailedIds((prev) => [...prev, toRetry[i]]);
      }

      setProgress(i + 1);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsRunning(false);
    router.refresh();
  }, [failedIds, router, populateSingle, waitWhilePaused]);

  const handleStop = useCallback(() => {
    abortRef.current = true;
    setIsRunning(false);
    router.refresh();
  }, [router]);

  if (isRunning) {
    const currentTotal =
      failedIds.length > 0 && progress === 0
        ? failedIds.length
        : total;

    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-muted-foreground">
          {isPaused ? (
            <span className="text-yellow-600 font-medium">
              Paused (tab in background) — {progress} / {currentTotal}
            </span>
          ) : (
            <>
              Populating {progress} / {currentTotal}
              {errors > 0 && (
                <span className="text-red-500 ml-2">({errors} errors)</span>
              )}
            </>
          )}
        </div>
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isPaused ? "bg-yellow-500" : "bg-green-500"
            }`}
            style={{ width: `${(progress / currentTotal) * 100}%` }}
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleStop}>
          Stop
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handlePopulateAll}>
        Populate All ({total})
      </Button>
      {failedIds.length > 0 && (
        <Button
          variant="outline"
          className="text-red-600 border-red-300"
          onClick={handleRetryFailed}
        >
          Retry Failed ({failedIds.length})
        </Button>
      )}
    </div>
  );
}
