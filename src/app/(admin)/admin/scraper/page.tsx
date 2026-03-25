"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { CheckCircle, XCircle, Download, RefreshCw } from "lucide-react";
import type { PikePlant } from "@/app/api/scraper/pike/route";

// ── Store definitions ───────────────────────────────────────────────────────
const STORES_GA = [
  { handle: "acworth", label: "Acworth" },
  { handle: "buckhead", label: "Buckhead" },
  { handle: "cumming", label: "Cumming" },
  { handle: "holcomb-bridge", label: "Holcomb Bridge" },
  { handle: "johns-creek", label: "Johns Creek" },
  { handle: "lindbergh", label: "Lindbergh" },
  { handle: "marietta-barrett-pkwy-west-cobb", label: "Marietta – West Cobb" },
  { handle: "marietta-johnson-ferry-rd-east-cobb", label: "Marietta – East Cobb" },
  { handle: "marietta-roswell-rd", label: "Marietta – Roswell Rd." },
  { handle: "milton", label: "Milton" },
  { handle: "peachtree-city", label: "Peachtree City" },
  { handle: "roswell-crossville-rd", label: "Roswell – Crossville Rd." },
  { handle: "suwanee", label: "Suwanee" },
  { handle: "toco-hills", label: "Toco Hills" },
  { handle: "towne-lake", label: "Towne Lake" },
];

const STORES_NC = [
  { handle: "ballantyne-nc", label: "Ballantyne (NC)" },
  { handle: "highland-creek-nc", label: "Highland Creek (NC)" },
  { handle: "lake-norman-nc", label: "Lake Norman (NC)" },
  { handle: "matthews-nc", label: "Matthews (NC)" },
];

const ALL_STORES = [...STORES_GA, ...STORES_NC];

// ── Helpers ─────────────────────────────────────────────────────────────────
function exportCsv(plants: PikePlant[], stores: string[]) {
  const storeLabels = stores.map(
    (h) => ALL_STORES.find((s) => s.handle === h)?.label ?? h
  );

  const header = ["Name", "Price", "SKU", "Categories", ...storeLabels];
  const rows = plants.map((p) => [
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.price}"`,
    `"${p.sku}"`,
    `"${p.categories.join(", ")}"`,
    ...stores.map((s) => (p.availability[s] ? "In Stock" : "Out of Stock")),
  ]);

  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pike-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function PikeScraperPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    plants: PikePlant[];
    total: number;
    stores: string[];
  } | null>(null);

  function toggleStore(handle: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(handle) ? next.delete(handle) : next.add(handle);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(ALL_STORES.map((s) => s.handle)));
  }

  function selectNone() {
    setSelected(new Set());
  }

  async function runScraper() {
    if (selected.size === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/scraper/pike", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stores: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scraper failed");
    } finally {
      setLoading(false);
    }
  }

  const selectedStores = result?.stores ?? [];
  const storeLabels = (handles: string[]) =>
    handles.map((h) => ALL_STORES.find((s) => s.handle === h)?.label ?? h);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pike Nurseries Inventory Scraper</h1>
        <p className="text-muted-foreground mt-1">
          Fetch live in-stock plants from Pike Nurseries locations.
        </p>
      </div>

      {/* Store selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Locations</CardTitle>
          <CardDescription>
            Choose one or more stores to check inventory.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={selectNone}>
              Clear
            </Button>
            <span className="text-sm text-muted-foreground self-center">
              {selected.size} of {ALL_STORES.length} selected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Georgia */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Georgia
              </p>
              <div className="space-y-2">
                {STORES_GA.map((store) => (
                  <label
                    key={store.handle}
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(store.handle)}
                      onChange={() => toggleStore(store.handle)}
                      className="h-4 w-4 accent-green-600"
                    />
                    <span className="text-sm">{store.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* North Carolina */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                North Carolina
              </p>
              <div className="space-y-2">
                {STORES_NC.map((store) => (
                  <label
                    key={store.handle}
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(store.handle)}
                      onChange={() => toggleStore(store.handle)}
                      className="h-4 w-4 accent-green-600"
                    />
                    <span className="text-sm">{store.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={runScraper}
            disabled={selected.size === 0 || loading}
            className="mt-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scraping…
              </>
            ) : (
              "Run Scraper"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-4 text-red-700 text-sm">{error}</CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {result.total} plants in stock across{" "}
                {storeLabels(selectedStores).join(", ")}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCsv(result.plants, result.stores)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plant Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categories</TableHead>
                  {selectedStores.map((h) => (
                    <TableHead key={h} className="text-center whitespace-nowrap">
                      {ALL_STORES.find((s) => s.handle === h)?.label ?? h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.plants.map((plant) => (
                  <TableRow key={plant.sku}>
                    <TableCell>
                      <a
                        href={plant.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-green-700 hover:underline"
                      >
                        {plant.name}
                      </a>
                    </TableCell>
                    <TableCell>${plant.price}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {plant.sku}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {plant.categories.slice(0, 2).join(", ")}
                    </TableCell>
                    {selectedStores.map((h) => (
                      <TableCell key={h} className="text-center">
                        {plant.availability[h] ? (
                          <CheckCircle className="h-4 w-4 text-green-600 inline" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400 inline" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
