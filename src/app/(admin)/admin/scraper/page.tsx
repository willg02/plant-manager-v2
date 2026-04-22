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
import { CheckCircle, XCircle, Download, RefreshCw, Info } from "lucide-react";
import type { PikePlant } from "@/app/api/scraper/pike/route";
import type { LowesPlant, LowesStore } from "@/app/api/scraper/lowes/route";

type ScraperTab = "pike" | "lowes";

// ── Pike store definitions ────────────────────────────────────────────────────
const PIKE_STORES_GA = [
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

const PIKE_STORES_NC = [
  { handle: "ballantyne-nc", label: "Ballantyne (NC)" },
  { handle: "highland-creek-nc", label: "Highland Creek (NC)" },
  { handle: "lake-norman-nc", label: "Lake Norman (NC)" },
  { handle: "matthews-nc", label: "Matthews (NC)" },
];

const ALL_PIKE_STORES = [...PIKE_STORES_GA, ...PIKE_STORES_NC];

// ── Lowe's store definitions ──────────────────────────────────────────────────
// Store number = 4-digit suffix from lowes.com/store/GA-City/XXXX
const LOWES_STORES_GA: LowesStore[] = [
  { id: "0458", label: "Acworth" },
  { id: "0609", label: "Canton" },
  { id: "0455", label: "Kennesaw" },
  { id: "0597", label: "Marietta" },
  { id: "0469", label: "Woodstock" },
  { id: "0634", label: "Cumming" },
  { id: "0516", label: "Alpharetta" },
  { id: "0554", label: "Roswell" },
];

const LOWES_STORES_NC: LowesStore[] = [
  { id: "2546", label: "Ballantyne" },
  { id: "0432", label: "Matthews" },
  { id: "2579", label: "Huntersville" },
  { id: "2614", label: "Mooresville" },
];

const ALL_LOWES_STORES = [...LOWES_STORES_GA, ...LOWES_STORES_NC];

// ── CSV helpers ───────────────────────────────────────────────────────────────
function exportPikeCsv(plants: PikePlant[], stores: string[]) {
  const storeLabels = stores.map(
    (h) => ALL_PIKE_STORES.find((s) => s.handle === h)?.label ?? h
  );
  const header = ["Name", "Price", "SKU", "Categories", ...storeLabels];
  const rows = plants.map((p) => [
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.price}"`,
    `"${p.sku}"`,
    `"${p.categories.join(", ")}"`,
    ...stores.map((s) => (p.availability[s] ? "In Stock" : "Out of Stock")),
  ]);
  downloadCsv([header, ...rows], `pike-inventory-${today()}.csv`);
}

function exportLowesCsv(plants: LowesPlant[], stores: LowesStore[]) {
  const header = ["Name", "Brand", "Price", "Item ID", ...stores.map((s) => s.label)];
  const rows = plants.map((p) => [
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.brand.replace(/"/g, '""')}"`,
    p.price ? `"$${p.price}"` : '""',
    `"${p.itemId}"`,
    ...stores.map((s) => (p.availability[s.id] ? "In Stock" : "Out of Stock")),
  ]);
  downloadCsv([header, ...rows], `lowes-inventory-${today()}.csv`);
}

function downloadCsv(rows: string[][], filename: string) {
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ScraperPage() {
  const [tab, setTab] = useState<ScraperTab>("pike");

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory Scraper</h1>
        <p className="text-muted-foreground mt-1">
          Fetch live in-stock plant data from local nursery and retail locations.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted p-1 w-fit">
        <button
          onClick={() => setTab("pike")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "pike"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Pike Nurseries
        </button>
        <button
          onClick={() => setTab("lowes")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "lowes"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Lowe&apos;s
        </button>
      </div>

      {tab === "pike" && <PikeScraper />}
      {tab === "lowes" && <LowesScraper />}
    </div>
  );
}

// ── Pike scraper panel ────────────────────────────────────────────────────────
function PikeScraper() {
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
      if (next.has(handle)) { next.delete(handle); } else { next.add(handle); }
      return next;
    });
  }

  function selectAll() { setSelected(new Set(ALL_PIKE_STORES.map((s) => s.handle))); }
  function selectNone() { setSelected(new Set()); }

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
  const storeLabel = (h: string) => ALL_PIKE_STORES.find((s) => s.handle === h)?.label ?? h;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pike Nurseries — Select Locations</CardTitle>
          <CardDescription>Choose one or more stores to check inventory.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
            <Button variant="outline" size="sm" onClick={selectNone}>Clear</Button>
            <span className="text-sm text-muted-foreground self-center">
              {selected.size} of {ALL_PIKE_STORES.length} selected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StoreGroup
              label="Georgia"
              stores={PIKE_STORES_GA}
              selected={selected}
              onToggle={toggleStore}
              getKey={(s) => s.handle}
              accent="accent-green-600"
            />
            <StoreGroup
              label="North Carolina"
              stores={PIKE_STORES_NC}
              selected={selected}
              onToggle={toggleStore}
              getKey={(s) => s.handle}
              accent="accent-green-600"
            />
          </div>

          <Button onClick={runScraper} disabled={selected.size === 0 || loading} className="mt-2">
            {loading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Scraping…</> : "Run Scraper"}
          </Button>
        </CardContent>
      </Card>

      {error && <ErrorCard message={error} />}

      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {result.total} plants in stock across {selectedStores.map(storeLabel).join(", ")}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => exportPikeCsv(result.plants, result.stores)}>
              <Download className="h-4 w-4 mr-2" />Export CSV
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
                    <TableHead key={h} className="text-center whitespace-nowrap">{storeLabel(h)}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.plants.map((plant) => (
                  <TableRow key={plant.sku}>
                    <TableCell>
                      <a href={plant.url} target="_blank" rel="noopener noreferrer"
                        className="font-medium text-green-700 hover:underline">
                        {plant.name}
                      </a>
                    </TableCell>
                    <TableCell>${plant.price}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{plant.sku}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {plant.categories.slice(0, 2).join(", ")}
                    </TableCell>
                    {selectedStores.map((h) => (
                      <TableCell key={h} className="text-center">
                        <AvailIcon available={plant.availability[h]} />
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

// ── Lowe's scraper panel ──────────────────────────────────────────────────────
function LowesScraper() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    plants: LowesPlant[];
    total: number;
    stores: LowesStore[];
  } | null>(null);

  function toggleStore(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function selectAll() { setSelected(new Set(ALL_LOWES_STORES.map((s) => s.id))); }
  function selectNone() { setSelected(new Set()); }

  async function runScraper() {
    if (selected.size === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const selectedStores = ALL_LOWES_STORES.filter((s) => selected.has(s.id));
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
    <div className="space-y-6">
      {/* ScraperAPI notice */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-200 space-y-1">
              <p className="font-semibold">Runs via ScraperAPI</p>
              <p>
                Lowe&apos;s uses Imperva bot protection. Requests are proxied through{" "}
                <a href="https://scraperapi.com" target="_blank" rel="noopener noreferrer"
                  className="underline font-medium">ScraperAPI
                </a>{" "}
                (free tier: ~100 store fetches/month). Allow 30–60 s per store.
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Store numbers are the 4-digit suffix from lowes.com/store/GA-City/<strong>XXXX</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lowe&apos;s — Select Locations</CardTitle>
          <CardDescription>Choose one or more stores to check plant inventory.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
            <Button variant="outline" size="sm" onClick={selectNone}>Clear</Button>
            <span className="text-sm text-muted-foreground self-center">
              {selected.size} of {ALL_LOWES_STORES.length} selected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StoreGroup
              label="Georgia"
              stores={LOWES_STORES_GA}
              selected={selected}
              onToggle={toggleStore}
              getKey={(s) => s.id}
              accent="accent-blue-600"
              sublabel={(s) => `#${s.id}`}
            />
            <StoreGroup
              label="North Carolina"
              stores={LOWES_STORES_NC}
              selected={selected}
              onToggle={toggleStore}
              getKey={(s) => s.id}
              accent="accent-blue-600"
              sublabel={(s) => `#${s.id}`}
            />
          </div>

          <Button onClick={runScraper} disabled={selected.size === 0 || loading} className="mt-2">
            {loading
              ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Scraping… (30–60 s per store)</>
              : "Run Scraper"}
          </Button>
        </CardContent>
      </Card>

      {error && <ErrorCard message={error} />}

      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {result.total} plants in stock across {selectedStores.map((s) => s.label).join(", ")}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => exportLowesCsv(result.plants, result.stores)}>
              <Download className="h-4 w-4 mr-2" />Export CSV
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
                    <TableHead key={s.id} className="text-center whitespace-nowrap">{s.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.plants.map((plant) => (
                  <TableRow key={plant.itemId}>
                    <TableCell>
                      <a href={plant.url} target="_blank" rel="noopener noreferrer"
                        className="font-medium text-blue-700 dark:text-blue-400 hover:underline">
                        {plant.name}
                      </a>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{plant.brand || "—"}</TableCell>
                    <TableCell>{plant.price ? `$${plant.price}` : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{plant.itemId}</TableCell>
                    {selectedStores.map((s) => (
                      <TableCell key={s.id} className="text-center">
                        <AvailIcon available={plant.availability[s.id]} />
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

// ── Shared sub-components ─────────────────────────────────────────────────────
function StoreGroup<T extends { label: string }>({
  label,
  stores,
  selected,
  onToggle,
  getKey,
  accent,
  sublabel,
}: {
  label: string;
  stores: T[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  getKey: (s: T) => string;
  accent: string;
  sublabel?: (s: T) => string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
        {label}
      </p>
      <div className="space-y-2">
        {stores.map((store) => {
          const key = getKey(store);
          return (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selected.has(key)}
                onChange={() => onToggle(key)}
                className={`h-4 w-4 ${accent}`}
              />
              <span className="text-sm">{store.label}</span>
              {sublabel && (
                <span className="text-xs text-muted-foreground">{sublabel(store)}</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function AvailIcon({ available }: { available: boolean | undefined }) {
  return available ? (
    <CheckCircle className="h-4 w-4 text-green-600 inline" />
  ) : (
    <XCircle className="h-4 w-4 text-red-400 inline" />
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40">
      <CardContent className="pt-4 text-red-700 dark:text-red-300 text-sm whitespace-pre-wrap">
        {message}
      </CardContent>
    </Card>
  );
}
