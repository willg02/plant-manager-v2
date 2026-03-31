"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

interface Props {
  count: number;
  action: () => Promise<{ deleted: number }>;
}

export function ClearUnpopulatedButton({ count, action }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    const ok = window.confirm(
      `Delete all ${count} unpopulated plant${count === 1 ? "" : "s"}?\n\nThis will remove plants that have NOT been AI-populated yet, along with their availability records.\n\nThis cannot be undone.`
    );
    if (!ok) return;

    setLoading(true);
    try {
      await action();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="destructive"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
      {loading ? "Clearing..." : `Clear Unpopulated (${count})`}
    </Button>
  );
}
