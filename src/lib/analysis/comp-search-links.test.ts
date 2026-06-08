import { describe, expect, it } from "vitest";
import {
  buildCompSearchLinks,
  buildCompSearchQuery,
  buildEbaySoldSearchUrl,
  buildIdentityCompSearchQuery,
  buildItemNameCompSearchQuery,
  shouldUseIdentityForCompSearch,
} from "@/lib/analysis/comp-search-links";
import type { ItemIdentity } from "@/lib/types/item-identity";
import { EMPTY_ITEM_IDENTITY } from "@/lib/types/item-identity";

function makeIdentity(overrides: Partial<ItemIdentity> = {}): ItemIdentity {
  return { ...EMPTY_ITEM_IDENTITY, ...overrides };
}

describe("shouldUseIdentityForCompSearch", () => {
  it("uses identity for medium/high confidence without conflicts", () => {
    expect(
      shouldUseIdentityForCompSearch(
        makeIdentity({ confidence: "high", brand: "Apple" })
      )
    ).toBe(true);
    expect(
      shouldUseIdentityForCompSearch(
        makeIdentity({ confidence: "medium", brand: "DeWalt" })
      )
    ).toBe(true);
  });

  it("falls back when confidence is low or conflicts exist", () => {
    expect(
      shouldUseIdentityForCompSearch(
        makeIdentity({ confidence: "low", brand: "Apple" })
      )
    ).toBe(false);
    expect(
      shouldUseIdentityForCompSearch(
        makeIdentity({
          confidence: "high",
          brand: "Apple",
          hasConflict: true,
        })
      )
    ).toBe(false);
  });
});

describe("buildIdentityCompSearchQuery", () => {
  it("includes brand, family, model, and storage variant at high confidence", () => {
    const query = buildIdentityCompSearchQuery(
      makeIdentity({
        confidence: "high",
        brand: "Apple",
        productFamily: "iPhone",
        model: "iPhone 13 Pro",
        variant: "128GB",
      })
    );

    expect(query).toContain("Apple");
    expect(query).toContain("iPhone");
    expect(query).toContain("128GB");
  });

  it("avoids over-specific variant at medium confidence", () => {
    const query = buildIdentityCompSearchQuery(
      makeIdentity({
        confidence: "medium",
        brand: "Milwaukee",
        productFamily: "M18 Fuel",
        model: "M18 Fuel drill",
        variant: "brushless",
      })
    );

    expect(query).toContain("Milwaukee");
    expect(query).not.toContain("brushless");
  });
});

describe("buildCompSearchQuery", () => {
  it("builds identity-based query for reliable identity", () => {
    const result = buildCompSearchQuery("cordless drill", {
      ...EMPTY_ITEM_IDENTITY,
      confidence: "high",
      brand: "DeWalt",
      productFamily: "XR",
      model: "DCF887",
      hasConflict: false,
    });

    expect(result?.source).toBe("identity");
    expect(result?.sourceLabel).toBe("Identity-based");
    expect(result?.query).toContain("DeWalt");
    expect(result?.links).toHaveLength(6);
  });

  it("falls back to item name when identity confidence is low", () => {
    const result = buildCompSearchQuery("Vintage leather jacket", {
      ...EMPTY_ITEM_IDENTITY,
      confidence: "low",
      brand: "Patagonia",
    });

    expect(result?.source).toBe("itemName");
    expect(result?.sourceLabel).toBe("Item-name fallback");
    expect(result?.query).toBe("Vintage leather jacket");
  });

  it("falls back to item name when identity has conflicts", () => {
    const result = buildCompSearchQuery("Phone bundle", {
      ...EMPTY_ITEM_IDENTITY,
      confidence: "high",
      brand: "Samsung",
      hasConflict: true,
      warnings: ["Conflicting identity signals detected"],
    });

    expect(result?.source).toBe("itemName");
    expect(result?.query).toBe("Phone bundle");
  });

  it("returns null when no usable query exists", () => {
    expect(buildCompSearchQuery("", EMPTY_ITEM_IDENTITY)).toBeNull();
  });
});

describe("buildCompSearchLinks", () => {
  it("generates platform URLs with encoded query", () => {
    const links = buildCompSearchLinks("iPhone 13 Pro");
    const ebaySold = links.find((l) => l.platform === "ebaySold");

    expect(ebaySold?.label).toBe("eBay sold");
    expect(ebaySold?.url).toContain(encodeURIComponent("iPhone 13 Pro"));
    expect(ebaySold?.url).toContain("LH_Sold=1");
  });

  it("builds eBay sold URL deterministically", () => {
    expect(buildEbaySoldSearchUrl("Milwaukee M18")).toBe(
      "https://www.ebay.com/sch/i.html?_nkw=Milwaukee%20M18&LH_Sold=1&LH_Complete=1"
    );
  });
});

describe("buildItemNameCompSearchQuery", () => {
  it("normalizes whitespace in item name", () => {
    expect(buildItemNameCompSearchQuery("  Sony   WH-1000XM5  ")).toBe(
      "Sony WH-1000XM5"
    );
  });
});
