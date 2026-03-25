"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export default function NewRegionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    state: "",
    description: "",
    climateZone: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Region name is required.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const body: Record<string, string> = { name: form.name.trim() };
      if (form.state.trim()) body.state = form.state.trim();
      if (form.description.trim()) body.description = form.description.trim();
      if (form.climateZone.trim()) body.climateZone = form.climateZone.trim();

      const res = await fetch("/api/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create region");
      }

      router.push("/admin/regions");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-4 text-2xl font-bold">Add New Region</h2>

      <Card>
        <CardHeader>
          <CardTitle>Region Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">City / Region Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Charlotte"
                required
              />
              <p className="text-xs text-muted-foreground">Use a city name for maximum specificity (e.g. "Charlotte", "Atlanta", "Denver")</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
                placeholder="e.g. NC"
              />
              <p className="text-xs text-muted-foreground">Shown alongside the city name (e.g. "Charlotte, NC")</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="climateZone">Hardiness Zone</Label>
              <Input
                id="climateZone"
                value={form.climateZone}
                onChange={(e) => updateField("climateZone", e.target.value)}
                placeholder="e.g. 7b"
              />
              <p className="text-xs text-muted-foreground">USDA hardiness zone — used by AI for plant recommendations</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                placeholder="e.g. Piedmont region of NC, hot humid summers, mild winters, zones 7b-8a"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Region"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/regions")}
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
