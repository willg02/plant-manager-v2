/**
 * Maps a raw CSV row (Record<string, string>) to an upload row using a column mapping.
 * Extracted to be testable independently of the UI.
 */
export interface UploadRow {
  commonName: string;
  botanicalName?: string;
  price?: number;
  size?: string;
  inStock?: boolean;
}

export function mapCsvRow(
  raw: Record<string, string>,
  columnMapping: Record<string, string>
): UploadRow | null {
  const mapped: Record<string, string> = {};

  for (const [csvCol, field] of Object.entries(columnMapping)) {
    if (field && raw[csvCol] !== undefined) {
      mapped[field] = raw[csvCol];
    }
  }

  if (!mapped.commonName?.trim()) return null;

  const row: UploadRow = {
    commonName: mapped.commonName.trim(),
  };

  if (mapped.botanicalName?.trim()) {
    row.botanicalName = mapped.botanicalName.trim();
  }

  if (mapped.price?.trim()) {
    const cleaned = mapped.price.replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num >= 0) {
      row.price = num;
    }
  }

  if (mapped.size?.trim()) {
    row.size = mapped.size.trim();
  }

  if (mapped.inStock !== undefined && mapped.inStock.trim() !== "") {
    const val = mapped.inStock.trim().toLowerCase();
    row.inStock = ["true", "yes", "1", "y", "in stock"].includes(val);
  }

  return row;
}

/**
 * Maps all rows, filtering out null results (rows with no commonName).
 */
export function mapCsvRows(
  rows: Record<string, string>[],
  columnMapping: Record<string, string>
): { valid: UploadRow[]; skipped: number } {
  const valid: UploadRow[] = [];
  let skipped = 0;

  for (const row of rows) {
    const mapped = mapCsvRow(row, columnMapping);
    if (mapped) {
      valid.push(mapped);
    } else {
      skipped++;
    }
  }

  return { valid, skipped };
}
