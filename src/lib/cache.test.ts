import { describe, it, expect, vi } from "vitest";
import { cached, invalidateCache } from "./cache";

describe("cached", () => {
  it("calls factory on first access", async () => {
    const factory = vi.fn().mockResolvedValue("hello");
    const result = await cached("test-key-1", 10000, factory);
    expect(result).toBe("hello");
    expect(factory).toHaveBeenCalledOnce();
  });

  it("returns cached value on second access", async () => {
    const factory = vi.fn().mockResolvedValue("world");
    await cached("test-key-2", 10000, factory);
    const result = await cached("test-key-2", 10000, factory);
    expect(result).toBe("world");
    expect(factory).toHaveBeenCalledOnce(); // not called again
  });

  it("calls factory again after TTL expires", async () => {
    let callCount = 0;
    const factory = vi.fn().mockImplementation(async () => {
      callCount++;
      return `value-${callCount}`;
    });

    const r1 = await cached("test-key-3", 1, factory); // 1ms TTL
    expect(r1).toBe("value-1");

    // Wait for expiry
    await new Promise((r) => setTimeout(r, 10));

    const r2 = await cached("test-key-3", 1, factory);
    expect(r2).toBe("value-2");
    expect(factory).toHaveBeenCalledTimes(2);
  });
});

describe("invalidateCache", () => {
  it("invalidates by exact key", async () => {
    const factory = vi.fn().mockResolvedValue("cached");
    await cached("inv-key-1", 60000, factory);
    invalidateCache("inv-key-1");

    // Factory should be called again
    await cached("inv-key-1", 60000, factory);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("invalidates by prefix", async () => {
    const f1 = vi.fn().mockResolvedValue("a");
    const f2 = vi.fn().mockResolvedValue("b");
    await cached("prefix:1", 60000, f1);
    await cached("prefix:2", 60000, f2);

    invalidateCache("prefix:");

    // Both should be re-fetched
    await cached("prefix:1", 60000, f1);
    await cached("prefix:2", 60000, f2);
    expect(f1).toHaveBeenCalledTimes(2);
    expect(f2).toHaveBeenCalledTimes(2);
  });
});
