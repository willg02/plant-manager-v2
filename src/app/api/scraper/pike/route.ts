import { NextResponse } from "next/server";

const SITE_ID = "kl3r8k";
const BASE_URL = `https://${SITE_ID}.a.searchspring.io/api/search/category.json`;
const RESULTS_PER_PAGE = 100;

export interface PikePlant {
  name: string;
  price: string;
  sku: string;
  handle: string;
  url: string;
  categories: string[];
  availability: Record<string, boolean>; // store handle -> in stock
}

export async function POST(req: Request) {
  try {
    const { stores } = (await req.json()) as { stores: string[] };

    if (!stores || stores.length === 0) {
      return NextResponse.json({ error: "No stores selected" }, { status: 400 });
    }

    // Fetch all products in stock at any selected store, deduped by uid.
    // Each product already carries full ss_store_availability for all stores.
    const allProducts = new Map<string, Record<string, unknown>>();

    for (const store of stores) {
      let page = 1;
      let totalPages = 1;

      do {
        const params = new URLSearchParams({
          siteId: SITE_ID,
          "bgfilter.collection_handle": "plants",
          "filter.ss_store_availability": `${store}:In stock`,
          resultsFormat: "native",
          resultsPerPage: String(RESULTS_PER_PAGE),
          page: String(page),
        });

        const res = await fetch(`${BASE_URL}?${params}`, {
          headers: { "User-Agent": "Mozilla/5.0" },
          next: { revalidate: 0 },
        });

        if (!res.ok) {
          throw new Error(`SearchSpring API error: ${res.status}`);
        }

        const data = await res.json();

        if (page === 1) {
          totalPages = data.pagination?.totalPages ?? 1;
        }

        for (const product of data.results ?? []) {
          allProducts.set(product.uid, product);
        }

        page++;
      } while (page <= totalPages);
    }

    // Normalize results
    const plants: PikePlant[] = [...allProducts.values()].map((p) => {
      const availArray: string[] = (p.ss_store_availability as string[]) ?? [];

      const availability: Record<string, boolean> = {};
      for (const store of stores) {
        const entry = availArray.find((a) => a.startsWith(`${store}:`));
        availability[store] = entry?.endsWith("In stock") ?? false;
      }

      const categories = ((p.collection_handle as string[]) ?? []).filter(
        (c) => c !== "plants"
      );

      return {
        name: p.name as string,
        price: p.price as string,
        sku: p.sku as string,
        handle: p.handle as string,
        url: `https://shop.pikenursery.com/products/${p.handle}`,
        categories,
        availability,
      };
    });

    plants.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ plants, total: plants.length, stores });
  } catch (err) {
    console.error("Pike scraper error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scraper failed" },
      { status: 500 }
    );
  }
}
