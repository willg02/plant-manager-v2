import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma and claude before importing the module
vi.mock("@/lib/prisma", () => ({
  prisma: {
    plant: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/claude", () => ({
  claude: {
    messages: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/ai/prompts", () => ({
  POPULATE_SYSTEM_PROMPT: "system",
  buildPopulateUserPrompt: vi.fn(() => "user prompt"),
}));

import { populatePlantBatch } from "./populate-plant";
import { prisma } from "@/lib/prisma";
import { claude } from "@/lib/claude";

const mockPrisma = prisma as unknown as {
  plant: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

const mockClaude = claude as unknown as {
  messages: { create: ReturnType<typeof vi.fn> };
};

const fakeAiResponse = JSON.stringify({
  botanicalName: "Acer palmatum",
  plantType: "Shrub",
  confidence: "high",
});

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.plant.findUnique.mockResolvedValue({ id: "x", commonName: "Test" });
  mockPrisma.plant.update.mockResolvedValue({});
  mockClaude.messages.create.mockResolvedValue({
    content: [{ type: "text", text: fakeAiResponse }],
  });
});

describe("populatePlantBatch", () => {
  it("processes all plant IDs and returns results", async () => {
    const ids = ["a", "b", "c"];
    const results = await populatePlantBatch(ids);
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.success)).toBe(true);
  });

  it("runs in concurrent chunks — all chunks complete", async () => {
    const ids = ["1", "2", "3", "4", "5", "6", "7"];
    const results = await populatePlantBatch(ids, undefined, 3);
    expect(results).toHaveLength(7);
    expect(mockClaude.messages.create).toHaveBeenCalledTimes(7);
  });

  it("handles individual plant failures without stopping the batch", async () => {
    mockPrisma.plant.findUnique
      .mockResolvedValueOnce({ id: "a", commonName: "Good Plant" })
      .mockResolvedValueOnce(null) // plant not found
      .mockResolvedValueOnce({ id: "c", commonName: "Good Plant 2" });

    const results = await populatePlantBatch(["a", "b", "c"]);
    expect(results).toHaveLength(3);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[2].success).toBe(true);
  });
});
