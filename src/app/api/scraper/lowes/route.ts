import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300; // ScraperAPI render=true is ~30–60 s per store

// Lowe's plant category page — plants + live goods
const LOWES_CATEGORY_URL =
  "https://www.lowes.com/pl/Plants-Live-plants-Trees-shrubs-bushes/4294511668";
const PAGE_SIZE = 48; // Lowe's default PLP page size

export interface LowesPlant {
  name: string;
  itemId: string;
  modelId: string;
  price: string;       // formatted string, e.g. "9.98"
  brand: string;
  url: string;
  availability: Record<string, boolean>; // storeId -> in stock at that store
}

export interface LowesStore {
  id: string;   // 4-digit number, e.g. "0458"
  label: string;
}

interface RequestBody {
  stores: LowesStore[];
}

// ── ScraperAPI helper ─────────────────────────────────────────────────────────
// Lowe's uses Imperva Incapsula — direct fetch always returns 403.
// Route via ScraperAPI (https://scraperapi.com, free tier: 1 000 credits/month).
// Set SCRAPERAPI_KEY in your environment to enable.
function scraperUrl(targetUrl: string): string {
  const key = process.env.SCRAPERAPI_KEY;
  if (!key) throw new Error("SCRAPERAPI_KEY is not set. See /admin/scraper/lowes for setup instructions.");
  // render=true launches a headless browser to bypass bot challenges.
  // premium=false keeps credit cost at 10 per request (rendered).
  return `https://api.scraperapi.com?api_key=${key}&url=${encodeURIComponent(targetUrl)}&render=true&keep_headers=true`;
}

// ── __NEXT_DATA__ extractor ───────────────────────────────────────────────────
function extractNextData(html: string): unknown {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("Could not find __NEXT_DATA__ in page response. The page structure may have changed.");
  try {
    return JSON.parse(match[1]);
  } catch {
    throw new Error("Failed to parse __NEXT_DATA__ JSON.");
  }
}

// ── Product extractor ─────────────────────────────────────────────────────────
// Navigates the Next.js page data to find the products array.
// Lowe's embeds data at props.pageProps.initialData.data.searchReport or
// props.pageProps.initialData.data.products depending on page type.
// We try several known paths and fall back to a deep scan.
function extractProducts(nextData: unknown): RawProduct[] {
  const d = nextData as Record<string, unknown>;

  // Try known paths in order of likelihood
  const candidates = [
    deepGet(d, ["props", "pageProps", "initialData", "data", "products"]),
    deepGet(d, ["props", "pageProps", "initialData", "data", "searchReport", "products"]),
    deepGet(d, ["props", "pageProps", "products"]),
    deepGet(d, ["props", "pageProps", "searchResults", "products"]),
    deepGet(d, ["props", "pageProps", "initialData", "products"]),
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate as RawProduct[];
    }
  }

  // Deep scan: find any array of objects that look like products (has itemId and name/description)
  const found = deepScanForProducts(d);
  if (found) return found;

  throw new Error(
    "Could not locate products array in __NEXT_DATA__. " +
    "Inspect the raw response and update the path in extractProducts()."
  );
}

interface RawProduct {
  itemId?: string;
  omniItemId?: string;
  modelId?: string;
  description?: string;
  productLabel?: string;
  prdtDesc?: string;
  price?: { minPrice?: number; maxPrice?: number; value?: number };
  currentPrice?: number;
  brandName?: string;
  brand?: string;
}

function deepGet(obj: unknown, path: string[]): unknown {
  let cur = obj;
  for (const key of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function deepScanForProducts(obj: unknown, depth = 0): RawProduct[] | null {
  if (depth > 8 || obj == null || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    if (obj.length > 2 && obj.every((item) =>
      typeof item === "object" && item != null &&
      ("itemId" in item || "omniItemId" in item) &&
      ("description" in item || "productLabel" in item || "prdtDesc" in item)
    )) {
      return obj as RawProduct[];
    }
    for (const item of obj) {
      const found = deepScanForProducts(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  for (const val of Object.values(obj as Record<string, unknown>)) {
    const found = deepScanForProducts(val, depth + 1);
    if (found) return found;
  }
  return null;
}

// ── Normalise a raw product into LowesPlant ───────────────────────────────────
function normalisePlant(raw: RawProduct, storeId: string): LowesPlant {
  const itemId = String(raw.itemId ?? raw.omniItemId ?? "unknown");
  const name = String(raw.description ?? raw.productLabel ?? raw.prdtDesc ?? "Unknown Plant");
  const modelId = String(raw.modelId ?? "");
  const brand = String(raw.brandName ?? raw.brand ?? "");

  let price = "";
  if (raw.price?.minPrice != null) price = String(raw.price.minPrice);
  else if (raw.price?.value != null) price = String(raw.price.value);
  else if (raw.currentPrice != null) price = String(raw.currentPrice);

  return {
    name,
    itemId,
    modelId,
    price,
    brand,
    url: `https://www.lowes.com/pd/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))}-/${itemId}`,
    availability: { [storeId]: true }, // fetched via instore filter, so always true
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { stores } = (await req.json()) as RequestBody;

    if (!stores || stores.length === 0) {
      return NextResponse.json({ error: "No stores selected" }, { status: 400 });
    }

    // Ensure ScraperAPI key is present before doing any work
    if (!process.env.SCRAPERAPI_KEY) {
      return NextResponse.json(
        { error: "SCRAPERAPI_KEY environment variable is not set. Add it in Vercel → Settings → Environment Variables." },
        { status: 400 }
      );
    }

    // Keyed by itemId — store a merged plant object for deduplication
    const allPlants = new Map<string, LowesPlant>();

    for (const store of stores) {
      let offset = 0;
      let totalFetched = 0;
      let totalExpected = PAGE_SIZE; // updated after first page

      do {
        const pageUrl =
          `${LOWES_CATEGORY_URL}` +
          `?store=${store.id}` +
          `&productStatus=instore` +
          `&offset=${offset}` +
          `&limit=${PAGE_SIZE}`;

        const res = await fetch(scraperUrl(pageUrl), {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          // No caching — we always want live inventory
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`ScraperAPI returned HTTP ${res.status} for store ${store.label} (${store.id})`);
        }

        const html = await res.text();
        const nextData = extractNextData(html);
        const products = extractProducts(nextData);

        if (offset === 0) {
          // Try to get total count for pagination
          const totalCount = deepGet(nextData as Record<string, unknown>, [
            "props", "pageProps", "initialData", "data", "totalProducts",
          ]);
          if (typeof totalCount === "number" && totalCount > 0) {
            totalExpected = totalCount;
          } else {
            // Can't determine total — only fetch one page
            totalExpected = products.length;
          }
        }

        for (const raw of products) {
          const plant = normalisePlant(raw, store.id);
          const existing = allPlants.get(plant.itemId);
          if (existing) {
            // Merge availability from other stores
            existing.availability[store.id] = true;
          } else {
            // All stores not yet seen default to false
            const withAllStores: LowesPlant = {
              ...plant,
              availability: Object.fromEntries(stores.map((s) => [s.id, s.id === store.id])),
            };
            allPlants.set(plant.itemId, withAllStores);
          }
        }

        totalFetched += products.length;
        offset += PAGE_SIZE;
      } while (totalFetched < totalExpected && offset < 500); // cap at 500 to avoid runaway loops
    }

    const plants = [...allPlants.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return NextResponse.json({ plants, total: plants.length, stores });
  } catch (err) {
    console.error("Lowe's scraper error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scraper failed" },
      { status: 500 }
    );
  }
}
