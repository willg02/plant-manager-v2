"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";

interface Props {
  count: number;
  action: () => Promise<{ deleted: number }>;
}

export function DeleteAllPlantsButton({ count, action }: Props) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const CONFIRM_PHRASE = "DELETE ALL PLANTS";

  useEffect(() => {
    if (showModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showModal]);

  async function handleConfirm() {
    if (typed !== CONFIRM_PHRASE) return;
    setLoading(true);
    try {
      const result = await action();
      setShowModal(false);
      setTyped("");
      // Show browser alert with result
      window.alert(`Successfully deleted ${result.deleted} plant${result.deleted === 1 ? "" : "s"} and all associated data.`);
    } catch {
      window.alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setShowModal(true)}
        disabled={loading || count === 0}
      >
        <AlertTriangle className="size-4" />
        Delete All ({count})
      </Button>

      {/* Modal overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            {/* Warning header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Delete All Plants
                </h3>
                <p className="text-sm text-muted-foreground">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            {/* Warning details */}
            <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm text-foreground">
                This will permanently delete:
              </p>
              <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                <li>
                  &bull; <strong className="text-foreground">{count}</strong> plant{count === 1 ? "" : "s"} (both populated and unpopulated)
                </li>
                <li>&bull; All associated availability records</li>
                <li>&bull; All supplier inventory links</li>
              </ul>
            </div>

            {/* Type to confirm */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground">
                Type <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-destructive">{CONFIRM_PHRASE}</span> to confirm:
              </label>
              <input
                ref={inputRef}
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-destructive/50 focus:outline-none focus:ring-2 focus:ring-destructive/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirm();
                  if (e.key === "Escape") {
                    setShowModal(false);
                    setTyped("");
                  }
                }}
                disabled={loading}
              />
            </div>

            {/* Buttons */}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setTyped("");
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={typed !== CONFIRM_PHRASE || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Everything"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
