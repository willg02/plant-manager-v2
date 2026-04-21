/**
 * Parses plant size strings like "3-4 ft", "24 inches", "2'", "18-24 in"
 * into a numeric value in feet. Returns null if unparseable.
 *
 * For ranges, returns the midpoint (e.g. "3-4 ft" → 3.5).
 */
export function parseDimensionToFeet(input: string | null | undefined): number | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  if (!s) return null;

  // Detect unit. Default to feet if ambiguous but number is small; inches if large.
  const hasInches = /\b(in|inch|inches|")\b|"/.test(s);
  const hasFeet = /\b(ft|foot|feet|')\b|'/.test(s);
  const hasMeters = /\bm\b|\bmeter/.test(s);
  const hasCm = /\bcm\b|\bcentimeter/.test(s);

  // Extract all numbers (ints or decimals)
  const nums = [...s.matchAll(/\d+(?:\.\d+)?/g)].map((m) => parseFloat(m[0]));
  if (nums.length === 0) return null;

  const value = nums.length === 1 ? nums[0] : (nums[0] + nums[1]) / 2;

  let feet: number;
  if (hasInches && !hasFeet) {
    feet = value / 12;
  } else if (hasCm) {
    feet = value / 30.48;
  } else if (hasMeters) {
    feet = value * 3.28084;
  } else if (hasFeet) {
    feet = value;
  } else {
    // No unit — heuristic: ≥12 → assume inches; else feet
    feet = value >= 12 ? value / 12 : value;
  }

  if (!isFinite(feet) || feet <= 0 || feet > 200) return null;
  return Math.round(feet * 10) / 10;
}
