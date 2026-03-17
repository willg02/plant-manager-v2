"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

interface Supplier {
  id: string;
  name: string;
  regionId: string;
}

interface Region {
  id: string;
  name: string;
}

export default function NewPlantPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    commonName: "",
    botanicalName: "",
    supplierId: "",
    regionId: "",
    price: "",
    size: "",
    inStock: true,
    autoPopulate: false,
  });

  useEffect(() => {
    async function fetchData() {
      const [suppRes, regRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/regions"),
      ]);
      const suppData = await suppRes.json();
      const regData = await regRes.json();
      setSuppliers(suppData);
      setRegions(regData);
    }
    fetchData();
  }, []);

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.commonName.trim()) {
      setError("Common name is required.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const body: Record<string, unknown> = {
        commonName: form.commonName.trim(),
        autoPopulate: form.autoPopulate,
      };
      if (form.botanicalName.trim()) body.botanicalName = form.botanicalName.trim();
      if (form.supplierId) body.supplierId = form.supplierId;
      if (form.regionId) body.regionId = form.regionId;
      if (form.price) body.price = parseFloat(form.price);
      if (form.size) body.size = form.size;
      body.inStock = form.inStock;

      const res = await fetch("/api/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create plant");
      }

      router.push("/admin/plants");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-4 text-2xl font-bold">Add New Plant</h2>

      <Card>
        <CardHeader>
          <CardTitle>Plant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="commonName">Common Name *</Label>
              <Input
                id="commonName"
                value={form.commonName}
                onChange={(e) => updateField("commonName", e.target.value)}
                placeholder="e.g. Japanese Maple"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="botanicalName">Botanical Name</Label>
              <Input
                id="botanicalName"
                value={form.botanicalName}
                onChange={(e) => updateField("botanicalName", e.target.value)}
                placeholder="e.g. Acer palmatum"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierId">Supplier</Label>
                <select
                  id="supplierId"
                  value={form.supplierId}
                  onChange={(e) => updateField("supplierId", e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="regionId">Region</Label>
                <select
                  id="regionId"
                  value={form.regionId}
                  onChange={(e) => updateField("regionId", e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  <option value="">Select region...</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  value={form.size}
                  onChange={(e) => updateField("size", e.target.value)}
                  placeholder="e.g. 1 gallon"
                />
              </div>

              <div className="flex items-end space-x-2 pb-1">
                <input
                  type="checkbox"
                  id="inStock"
                  checked={form.inStock}
                  onChange={(e) => updateField("inStock", e.target.checked)}
                  className="size-4 rounded border-gray-300"
                />
                <Label htmlFor="inStock">In Stock</Label>
              </div>
            </div>

            <div className="flex items-center space-x-2 rounded-lg border bg-blue-50 p-3">
              <input
                type="checkbox"
                id="autoPopulate"
                checked={form.autoPopulate}
                onChange={(e) => updateField("autoPopulate", e.target.checked)}
                className="size-4 rounded border-gray-300"
              />
              <Label htmlFor="autoPopulate" className="text-sm">
                Auto-populate with AI (fills botanical name, care info, etc.)
              </Label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Plant"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/plants")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
