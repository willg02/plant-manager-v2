import { describe, it, expect } from "vitest";
import { mapCsvRow, mapCsvRows } from "./csv-mapper";

describe("mapCsvRow", () => {
  const mapping = {
    "Plant Name": "commonName",
    "Scientific Name": "botanicalName",
    "Cost": "price",
    "Container": "size",
    "Available": "inStock",
  };

  it("maps a complete row correctly", () => {
    const raw = {
      "Plant Name": "Japanese Maple",
      "Scientific Name": "Acer palmatum",
      "Cost": "$24.99",
      "Container": "3gal",
      "Available": "yes",
    };

    const result = mapCsvRow(raw, mapping);
    expect(result).toEqual({
      commonName: "Japanese Maple",
      botanicalName: "Acer palmatum",
      price: 24.99,
      size: "3gal",
      inStock: true,
    });
  });

  it("returns null when commonName is missing", () => {
    const raw = { "Plant Name": "", "Cost": "$10" };
    expect(mapCsvRow(raw, mapping)).toBeNull();
  });

  it("returns null when commonName column is not mapped", () => {
    const raw = { "Other Column": "Some Plant" };
    expect(mapCsvRow(raw, {})).toBeNull();
  });

  it("trims whitespace from all fields", () => {
    const raw = {
      "Plant Name": "  Rose Bush  ",
      "Scientific Name": "  Rosa  ",
      "Container": "  5gal  ",
    };

    const result = mapCsvRow(raw, mapping);
    expect(result).toEqual({
      commonName: "Rose Bush",
      botanicalName: "Rosa",
      size: "5gal",
    });
  });

  it("handles price with no dollar sign", () => {
    const raw = { "Plant Name": "Fern", "Cost": "12.50" };
    const result = mapCsvRow(raw, mapping);
    expect(result?.price).toBe(12.5);
  });

  it("handles price with commas", () => {
    const raw = { "Plant Name": "Tree", "Cost": "$1,250.00" };
    const result = mapCsvRow(raw, mapping);
    // commas get stripped by the regex, so "1250.00"
    expect(result?.price).toBe(1250);
  });

  it("skips invalid price values", () => {
    const raw = { "Plant Name": "Fern", "Cost": "N/A" };
    const result = mapCsvRow(raw, mapping);
    expect(result?.price).toBeUndefined();
  });

  it("maps various truthy inStock values", () => {
    for (const val of ["true", "True", "YES", "y", "1", "In Stock"]) {
      const raw = { "Plant Name": "Test", "Available": val };
      const result = mapCsvRow(raw, mapping);
      expect(result?.inStock).toBe(true);
    }
  });

  it("maps falsy inStock values", () => {
    for (const val of ["false", "no", "0", "out of stock", ""]) {
      const raw = { "Plant Name": "Test", "Available": val };
      const result = mapCsvRow(raw, mapping);
      // empty string doesn't set inStock at all
      if (val === "") {
        expect(result?.inStock).toBeUndefined();
      } else {
        expect(result?.inStock).toBe(false);
      }
    }
  });

  it("handles partial mapping (skip columns)", () => {
    const partialMapping = { "Name": "commonName" };
    const raw = { "Name": "Tulip", "Extra Col": "ignored" };
    const result = mapCsvRow(raw, partialMapping);
    expect(result).toEqual({ commonName: "Tulip" });
  });
});

describe("mapCsvRows", () => {
  const mapping = { "Name": "commonName", "Price": "price" };

  it("maps valid rows and counts skipped", () => {
    const rows = [
      { "Name": "Plant A", "Price": "10" },
      { "Name": "", "Price": "20" },
      { "Name": "Plant C", "Price": "" },
    ];

    const { valid, skipped } = mapCsvRows(rows, mapping);
    expect(valid).toHaveLength(2);
    expect(skipped).toBe(1);
    expect(valid[0].commonName).toBe("Plant A");
    expect(valid[1].commonName).toBe("Plant C");
  });

  it("returns empty array for all-invalid rows", () => {
    const rows = [{ "Name": "" }, { "Name": "  " }];
    const { valid, skipped } = mapCsvRows(rows, mapping);
    expect(valid).toHaveLength(0);
    expect(skipped).toBe(2);
  });
});
