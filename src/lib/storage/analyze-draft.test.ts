import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAnalyzeDraft,
  loadAnalyzeDraft,
  saveAnalyzeDraft,
} from "@/lib/storage/analyze-draft";

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe("analyze-draft", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageMock());
    clearAnalyzeDraft();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves and loads unsaved analyze draft", () => {
    saveAnalyzeDraft({
      input: {
        itemName: "Test drill",
        category: "Tools & Hardware",
        askingPrice: 50,
        condition: "Good",
        knownResaleValue: null,
        listingUrl: null,
        notes: "",
      },
      comps: [
        {
          id: "c1",
          title: "Sold comp",
          platform: "eBay",
          price: 80,
          condition: "Good",
          notes: "",
          listingType: "sold",
        },
      ],
      useCompsForResale: false,
      compsEstimateManualOff: true,
      updatedAt: "2026-06-08T00:00:00.000Z",
    });

    const loaded = loadAnalyzeDraft();
    expect(loaded?.input.itemName).toBe("Test drill");
    expect(loaded?.comps).toHaveLength(1);
    expect(loaded?.compsEstimateManualOff).toBe(true);
  });

  it("returns null for invalid stored draft", () => {
    localStorage.setItem("marketplace-goblin-analyze-draft", '{"bad":true}');
    expect(loadAnalyzeDraft()).toBeNull();
  });
});
