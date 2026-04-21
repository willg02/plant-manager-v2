import { describe, it, expect } from "vitest";
import { parseDimensionToFeet } from "./parse-dimensions";

describe("parseDimensionToFeet", () => {
  it("parses simple feet strings", () => {
    expect(parseDimensionToFeet("3 ft")).toBe(3);
    expect(parseDimensionToFeet("2 feet")).toBe(2);
    expect(parseDimensionToFeet("5'")).toBe(5);
  });

  it("parses inch strings", () => {
    expect(parseDimensionToFeet("24 inches")).toBe(2);
    expect(parseDimensionToFeet("18 in")).toBe(1.5);
    expect(parseDimensionToFeet('6"')).toBe(0.5);
  });

  it("parses ranges as midpoint", () => {
    expect(parseDimensionToFeet("3-4 ft")).toBe(3.5);
    expect(parseDimensionToFeet("18-24 inches")).toBe(1.8);
    expect(parseDimensionToFeet("2-3'")).toBe(2.5);
  });

  it("parses metric units", () => {
    expect(parseDimensionToFeet("1 m")).toBeCloseTo(3.3, 1);
    expect(parseDimensionToFeet("60 cm")).toBeCloseTo(2, 1);
  });

  it("applies heuristic when no unit", () => {
    expect(parseDimensionToFeet("3")).toBe(3); // feet
    expect(parseDimensionToFeet("24")).toBe(2); // inches
  });

  it("returns null for garbage", () => {
    expect(parseDimensionToFeet("")).toBeNull();
    expect(parseDimensionToFeet(null)).toBeNull();
    expect(parseDimensionToFeet("varies")).toBeNull();
    expect(parseDimensionToFeet("N/A")).toBeNull();
  });
});
