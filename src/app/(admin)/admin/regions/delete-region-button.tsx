"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  regionId: string;
  regionName: string;
  supplierCount: number;
  action: (formData: FormData) => Promise<void>;
}

export function DeleteRegionButton({ regionId, regionName, supplierCount, action }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleClick() {
    const lines = [
      `Delete region "${regionName}"?`,
      "",
      "This will permanently delete:",
      `  • ${supplierCount} supplier${supplierCount !== 1 ? "s" : ""} in this region`,
      "  • All plant availability records for this region",
      "  • All chat sessions for this region",
      "",
      "This cannot be undone.",
    ];

    if (window.confirm(lines.join("\n"))) {
      formRef.current?.requestSubmit();
    }
  }

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="regionId" value={regionId} />
      <Button variant="destructive" size="sm" type="button" onClick={handleClick}>
        Delete
      </Button>
    </form>
  );
}
