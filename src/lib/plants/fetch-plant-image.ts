const TIMEOUT_MS = 6000;

async function fetchFromINaturalist(query: string): Promise<string | null> {
  try {
    const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&rank=species&per_page=1&order_by=observations_count&order=desc`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.results?.[0]?.default_photo?.medium_url as string) ?? null;
  } catch {
    return null;
  }
}

async function fetchFromWikipedia(query: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.thumbnail?.source as string) ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch a representative image URL for a plant.
 * Tries iNaturalist first (accurate, photo-quality), falls back to Wikipedia.
 * Returns null if neither source has an image.
 */
export async function fetchPlantImage(
  botanicalName: string | null,
  commonName: string
): Promise<string | null> {
  // Use botanical name for accuracy; fall back to common name if needed
  const primary = botanicalName?.trim() || commonName.trim();
  const fallbackQuery = botanicalName ? commonName.trim() : null;

  const inatUrl = await fetchFromINaturalist(primary);
  if (inatUrl) return inatUrl;

  const wikiUrl = await fetchFromWikipedia(primary);
  if (wikiUrl) return wikiUrl;

  // Last resort: retry iNaturalist with common name if we used botanical above
  if (fallbackQuery) {
    const inatFallback = await fetchFromINaturalist(fallbackQuery);
    if (inatFallback) return inatFallback;
  }

  return null;
}
