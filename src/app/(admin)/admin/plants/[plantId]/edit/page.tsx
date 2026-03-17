"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface PlantData {
  id: string;
  commonName: string;
  botanicalName: string | null;
  alternateNames: string[];
  plantType: string | null;
  family: string | null;
  hardinessZoneMin: string | null;
  hardinessZoneMax: string | null;
  sunRequirement: string | null;
  waterNeeds: string | null;
  soilPreference: string | null;
  matureHeight: string | null;
  matureWidth: string | null;
  growthRate: string | null;
  bloomTime: string | null;
  bloomColor: string | null;
  foliageColor: string | null;
  nativeRegion: string | null;
  description: string | null;
  careTips: string | null;
  companionPlants: string[];
  imageUrl: string | null;
  aiPopulated: boolean;
  aiPopulatedAt: string | null;
  aiModel: string | null;
}

const AI_FIELDS = [
  "botanicalName",
  "plantType",
  "family",
  "hardinessZoneMin",
  "hardinessZoneMax",
  "sunRequirement",
  "waterNeeds",
  "soilPreference",
  "matureHeight",
  "matureWidth",
  "growthRate",
  "bloomTime",
  "bloomColor",
  "foliageColor",
  "nativeRegion",
  "description",
  "careTips",
];

function AiBadge() {
  return (
    <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
      <Sparkles className="size-3" />
      AI
    </span>
  );
}

export default function EditPlantPage() {
  const router = useRouter();
  const params = useParams();
  const plantId = params.plantId as string;

  const [plant, setPlant] = useState<PlantData | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [populating, setPopulating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPlant() {
      try {
        const res = await fetch(`/api/plants/${plantId}`);
        if (!res.ok) throw new Error("Failed to load plant");
        const data = await res.json();
        setPlant(data);

        const formValues: Record<string, string> = {};
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key])) {
            formValues[key] = data[key].join(", ");
          } else {
            formValues[key] = data[key]?.toString() || "";
          }
        }
        setForm(formValues);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load plant");
      } finally {
        setLoading(false);
      }
    }
    fetchPlant();
  }, [plantId]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const body: Record<string, unknown> = {};
      const fields = [
        "commonName",
        "botanicalName",
        "plantType",
        "family",
        "hardinessZoneMin",
        "hardinessZoneMax",
        "sunRequirement",
        "waterNeeds",
        "soilPreference",
        "matureHeight",
        "matureWidth",
        "growthRate",
        "bloomTime",
        "bloomColor",
        "foliageColor",
        "nativeRegion",
        "description",
        "careTips",
        "imageUrl",
      ];

      for (const field of fields) {
        body[field] = form[field]?.trim() || null;
      }

      // Handle array fields
      body.alternateNames = form.alternateNames
        ? form.alternateNames.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];
      body.companionPlants = form.companionPlants
        ? form.companionPlants.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];

      const res = await fetch(`/api/plants/${plantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update plant");
      }

      router.push("/admin/plants");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleRepopulate() {
    setPopulating(true);
    setError("");

    try {
      const res = await fetch("/api/ai/populate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to populate");
      }

      // Reload the plant data
      const plantRes = await fetch(`/api/plants/${plantId}`);
      const newData = await plantRes.json();
      setPlant(newData);

      const formValues: Record<string, string> = {};
      for (const key of Object.keys(newData)) {
        if (Array.isArray(newData[key])) {
          formValues[key] = newData[key].join(", ");
        } else {
          formValues[key] = newData[key]?.toString() || "";
        }
      }
      setForm(formValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setPopulating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading plant data...</p>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">Plant not found.</p>
      </div>
    );
  }

  function renderField(
    label: string,
    field: string,
    type: "input" | "textarea" = "input"
  ) {
    const isAiField = AI_FIELDS.includes(field) && plant?.aiPopulated;
    return (
      <div className="space-y-2">
        <Label htmlFor={field}>
          {label}
          {isAiField && <AiBadge />}
        </Label>
        {type === "textarea" ? (
          <Textarea
            id={field}
            value={form[field] || ""}
            onChange={(e) => updateField(field, e.target.value)}
            rows={3}
          />
        ) : (
          <Input
            id={field}
            value={form[field] || ""}
            onChange={(e) => updateField(field, e.target.value)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Edit Plant</h2>
        <div className="flex items-center gap-2">
          {plant.aiPopulated ? (
            <Badge className="bg-green-100 text-green-700">AI Populated</Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-700">Not Populated</Badge>
          )}
          <Button
            variant="outline"
            onClick={handleRepopulate}
            disabled={populating}
          >
            <Sparkles className="size-4" />
            {populating ? "Populating..." : "Re-populate with AI"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderField("Common Name", "commonName")}
            {renderField("Botanical Name", "botanicalName")}
            {renderField("Alternate Names (comma separated)", "alternateNames")}
            <div className="grid grid-cols-2 gap-4">
              {renderField("Plant Type", "plantType")}
              {renderField("Family", "family")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growing Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {renderField("Hardiness Zone Min", "hardinessZoneMin")}
              {renderField("Hardiness Zone Max", "hardinessZoneMax")}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderField("Sun Requirement", "sunRequirement")}
              {renderField("Water Needs", "waterNeeds")}
            </div>
            {renderField("Soil Preference", "soilPreference", "textarea")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {renderField("Mature Height", "matureHeight")}
              {renderField("Mature Width", "matureWidth")}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {renderField("Growth Rate", "growthRate")}
              {renderField("Bloom Time", "bloomTime")}
              {renderField("Bloom Color", "bloomColor")}
            </div>
            {renderField("Foliage Color", "foliageColor")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderField("Native Region", "nativeRegion", "textarea")}
            {renderField("Description", "description", "textarea")}
            {renderField("Care Tips", "careTips", "textarea")}
            {renderField("Companion Plants (comma separated)", "companionPlants")}
            {renderField("Image URL", "imageUrl")}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
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
    </div>
  );
}
