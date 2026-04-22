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
import {
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Plus,
  Trash2,
  Info,
} from "lucide-react";
import type { LowesPlant, LowesStore } from "@/app/api/scraper/lowes/route";

// ── Default stores ────────────────────────────────────────────────────────────
// Store numbers come from the Lowe's store URL:
//   lowes.com/store/GA-Acworth/0458  →  store id = 0458
// Edit freely — add your local stores, remove ones you don't need.
const DEFAULT_STORES: LowesStore[] = [
  // Georgia
  { id: "0458", label: "Acworth, GA" },
  { id: "0609", label: "Canton, GA" },
  { id: "0455", label: "Kennesaw, GA" },
  { id: "0597", label: "Marietta, GA" },
  { id: "0469", label: "Woodstock, GA" },
  { id: "0634", label: "Cumming, GA" },
  { id: "0516", label: "Alpharetta, GA" },
  { id: "0554", label: "Roswell, GA" },
  // North Carolina
  { id: "2546", label: "Ballantyne, NC" },
  { id: "0432", label: "Matthews, NC" },
  { id: "2579", label: "Huntersville, NC" },
  { id: "2614", label: "Mooresville, NC" },
];

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCsv(plants: LowesPlant[], stores: LowesStore[]) {
  const header = ["Name", "Brand", "Price", "Item ID", "Model ID", ...stores.map((s) => s.label)];
  const rows = plants.map((p) => [
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.brand.replace(/"/g, '""')}"`,
    p.price ? `"$${p.price}"` : '""',
    `"${p.itemId}"`,
    `"${p.modelId}"`,
    ...stores.map((s) => (p.availability[s.id] ? "In Stock" : "Out of Stock")),
  ]);

  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lowes-plants-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function LowesScraperPage() {
  const [stores, setStores] = useState<LowesStore[]>(DEFAULT_STORES);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    plants: LowesPlant[];
    total: number;
    stores: LowesStore[];
  } | null>(null);

  // Store editing
  const [addId, setAddId] = useState("");
  const [addLabel, setAddLabel] = useState("");

  function toggleStore(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }
  function selectAll() { setSelected(new Set(stores.map((s) => s.id))); }
  function selectNone() { setSelected(new Set()); }

  function addStore() {
    const id = addId.trim().padStart(4, "0");
    const label = addLabel.trim();
    if (!id || !label) return;
    if (stores.some((s) => s.id === id)) return;
    setStores((prev) => [...prev, { id, label }]);
    setAddId("");
    setAddLabel("");
  }

  function removeStore(id: string) {
    setStores((prev) => prev.filter((s) => s.id !== id));
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }

  async function runScraper() {
    if (selected.size === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const selectedStores = stores.filter((s) => selected.has(s.id));

    try {
      const res = await fetch("/api/scraper/lowes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stores: selectedStores }),
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

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lowe&apos;s Plant Inventory Scraper</h1>
        <p className="text-muted-foreground mt-1">
          Fetch live in-stock plants from local Lowe&apos;s locations.
        </p>
      </div>

      {/* Setup notice */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-200 space-y-1">
              <p className="font-semibold">ScraperAPI required</p>
              <p>
                Lowe&apos;s uses Imperva bot protection that blocks plain HTTP requests.
                This scraper routes through{" "}
                <a
                  href="https://scraperapi.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  ScraperAPI
                </a>{" "}
                (free tier: 1,000 credits/month — ~100 store fetches).
              </p>
              <p>
                Add your key:{" "}
                <code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-xs">
                  SCRAPERAPI_KEY=your_key_here
                </code>{" "}
                in Vercel → Settings → Environment Variables, then redeploy.
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Store numbers are the 4-digit suffix in the Lowe&apos;s store URL:
                lowes.com/store/GA-Acworth/<strong>0458</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Locations</CardTitle>
          <CardDescription>
            Choose stores to check. Edit the list to match your local Lowe&apos;s locations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={selectNone}>
              Clear
            </Button>
            <span className="text-sm text-muted-foreground self-center">
              {selected.size} of {stores.length} selected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {stores.map((store) => (
              <div key={store.id} className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selected.has(store.id)}
                    onChange={() => toggleStore(store.id)}
                    className="h-4 w-4 accent-blue-600 shrink-0"
                  />
                  <span className="text-sm truncate">{store.label}</span>
                  <span className="text-xs text-muted-foreground shrink-0">#{store.id}</span>
                </label>
                <button
                  onClick={() => removeStore(store.id)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  title="Remove store"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add custom store */}
          <div className="flex items-end gap-2 pt-2 border-t border-border">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Store number</label>
              <input
                type="text"
                maxLength={4}
                placeholder="0458"
                value={addId}
                onChange={(e) => setAddId(e.target.value.replace(/\D/g, ""))}
                className="w-24 rounded border border-border bg-card px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-muted-foreground">Label</label>
              <input
                type="text"
                placeholder="City, ST"
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addStore()}
                className="rounded border border-border bg-card px-2 py-1.5 text-sm"
              />
            </div>
            <Button variant="outline" size="sm" onClick={addStore} className="shrink-0">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          <Button
            onClick={runScraper}
            disabled={selected.size === 0 || loading}
            className="mt-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scraping… (this can take 30–60 s per store)
              </>
            ) : (
              "Run Scraper"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40">
          <CardContent className="pt-4 text-red-700 dark:text-red-300 text-sm whitespace-pre-wrap">
            {error}
          </CardContent>
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
                {result.stores.map((s) => s.label).join(", ")}
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
                  <TableHead>Brand</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Item ID</TableHead>
                  {selectedStores.map((s) => (
                    <TableHead key={s.id} className="text-center whitespace-nowrap">
                      {s.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.plants.map((plant) => (
                  <TableRow key={plant.itemId}>
                    <TableCell>
                      <a
                        href={plant.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-700 dark:text-blue-400 hover:underline"
                      >
                        {plant.name}
                      </a>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {plant.brand || "—"}
                    </TableCell>
                    <TableCell>
                      {plant.price ? `$${plant.price}` : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {plant.itemId}
                    </TableCell>
                    {selectedStores.map((s) => (
                      <TableCell key={s.id} className="text-center">
                        {plant.availability[s.id] ? (
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
