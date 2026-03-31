"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface SupplierClearButtonsProps {
  supplierId: string;
  supplierName: string;
  plantCount: number;
}

export function SupplierClearButtons({
  supplierId,
  supplierName,
  plantCount,
}: SupplierClearButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"inventory" | "plants" | null>(null);

  async function clearInventory() {
    if (
      !confirm(
        `Clear all inventory for "${supplierName}"?\n\n` +
          `This will remove ${plantCount} plant listing(s) from this supplier. ` +
          `The plants themselves will remain in the global catalog.\n\n` +
          `This cannot be undone.`
      )
    )
      return;

    setLoading("inventory");
    try {
      const res = await fetch(`/api/suppliers/${supplierId}/inventory`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to clear inventory");
      } else {
        const data = await res.json();
        toast.success(`Cleared ${data.deleted} listing(s) from "${supplierName}"`);
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  async function clearPlants() {
    if (
      !confirm(
        `Clear all plants for "${supplierName}"?\n\n` +
          `This will remove ${plantCount} plant listing(s) and permanently delete any plants ` +
          `that exist only for this supplier (not shared with others).\n\n` +
          `This cannot be undone.`
      )
    )
      return;

    setLoading("plants");
    try {
      const res = await fetch(`/api/suppliers/${supplierId}/plants`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to clear plants");
      } else {
        const data = await res.json();
        toast.success(
          `Cleared ${data.deletedAvailability} listing(s) and ${data.deletedPlants} plant(s) from "${supplierName}"`
        );
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={clearInventory}
        disabled={loading !== null || plantCount === 0}
        title="Remove this supplier's plant listings (keeps plants in global catalog)"
      >
        {loading === "inventory" ? "Clearing…" : "Clear Inventory"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={clearPlants}
        disabled={loading !== null || plantCount === 0}
        title="Remove listings and delete plants exclusive to this supplier"
      >
        {loading === "plants" ? "Clearing…" : "Clear Plants"}
      </Button>
    </>
  );
}
