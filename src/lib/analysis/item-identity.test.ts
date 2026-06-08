import { describe, expect, it } from "vitest";
import {
  buildIdentityHaystack,
  extractUrlIdentityHints,
  getItemIdentity,
  getItemIdentityFromText,
  getIdentityRiskAdjustment,
  upgradeEstimateConfidenceFromIdentity,
} from "@/lib/analysis/item-identity";
import type { ComparableSale } from "@/lib/types/comps";
import type { DealInput } from "@/lib/types/deal";
import { EMPTY_ITEM_IDENTITY } from "@/lib/types/item-identity";

function makeInput(overrides: Partial<DealInput> = {}): DealInput {
  return {
    itemName: "Test",
    category: "Electronics",
    askingPrice: 100,
    condition: "Good",
    knownResaleValue: null,
    listingUrl: null,
    notes: "",
    ...overrides,
  };
}

function makeComp(title: string): ComparableSale {
  return {
    id: "c1",
    title,
    platform: "eBay",
    price: 120,
    condition: "Good",
    notes: "",
    listingType: "sold",
  };
}

describe("getItemIdentityFromText", () => {
  it("detects Apple iPhone brand and model", () => {
    const identity = getItemIdentityFromText(
      "Apple iPhone 13 Pro 128GB unlocked",
      "Electronics"
    );

    expect(identity.brand).toBe("Apple");
    expect(identity.productFamily).toBe("iPhone");
    expect(identity.model?.toLowerCase()).toContain("iphone");
    expect(identity.variant).toBe("128GB");
    expect(identity.confidence).not.toBe("low");
  });

  it("detects Milwaukee M18 Fuel tool line", () => {
    const identity = getItemIdentityFromText(
      "Milwaukee M18 Fuel hammer drill bare tool",
      "Tools & Hardware"
    );

    expect(identity.brand).toBe("Milwaukee");
    expect(identity.productFamily).toBe("M18 Fuel");
    expect(identity.confidence).toMatch(/medium|high/);
  });

  it("detects PSA grading for collectibles", () => {
    const identity = getItemIdentityFromText(
      "Pokemon Charizard PSA 9 holo",
      "Collectibles & Antiques"
    );

    expect(identity.brand).toBe("Pokemon");
    expect(identity.variant).toBe("PSA 9");
    expect(identity.confidence).toMatch(/medium|high/);
  });

  it("detects vehicle year make model", () => {
    const identity = getItemIdentityFromText(
      "2018 Honda Civic EX sedan",
      "Vehicles & Parts"
    );

    expect(identity.brand).toBe("Honda");
    expect(identity.productFamily).toBe("Civic");
    expect(identity.model?.toLowerCase()).toContain("honda");
    expect(identity.variant).toBe("EX");
  });

  it("detects Patagonia clothing brand", () => {
    const identity = getItemIdentityFromText(
      "Patagonia Nano Puff jacket men's large",
      "Clothing & Accessories"
    );

    expect(identity.brand).toBe("Patagonia");
    expect(identity.confidence).toBe("low");
  });
});

describe("getItemIdentity", () => {
  it("merges item name, notes, comps, and URL hints", () => {
    const identity = getItemIdentity(
      makeInput({
        category: "Tools & Hardware",
        itemName: "Cordless drill",
        notes: "works great",
        listingUrl: "https://www.ebay.com/itm/dewalt-xr-impact-driver",
      }),
      [makeComp("DeWalt XR 20V Max impact")],
      { listingText: "brushless" }
    );

    expect(identity.brand).toBe("DeWalt");
    expect(identity.sources).toEqual(
      expect.arrayContaining(["itemName", "notes", "comps", "urlText", "listingText"])
    );
  });

  it("returns empty identity for unsupported categories", () => {
    const identity = getItemIdentity(
      makeInput({ category: "Books & Media", itemName: "Harry Potter set" })
    );

    expect(identity.brand).toBeNull();
    expect(identity.displayLabel).toBe(EMPTY_ITEM_IDENTITY.displayLabel);
  });
});

describe("confidence scoring helpers", () => {
  it("upgrades estimate confidence when identity is high", () => {
    const identity = getItemIdentityFromText(
      "iPhone 14 Pro Max 256GB",
      "Electronics"
    );

    expect(upgradeEstimateConfidenceFromIdentity("low", identity)).toBe(
      "medium"
    );
    expect(upgradeEstimateConfidenceFromIdentity("medium", identity)).toBe(
      "high"
    );
  });

  it("reduces risk when identity confidence is high", () => {
    const identity = getItemIdentityFromText(
      "Milwaukee M18 Fuel saw",
      "Tools & Hardware"
    );

    expect(getIdentityRiskAdjustment(identity)).toBeLessThan(0);
  });
});

describe("buildIdentityHaystack", () => {
  it("includes OCR and listing text buckets", () => {
    const { sources } = buildIdentityHaystack(makeInput(), [], {
      listingText: "Samsung Galaxy S22",
      ocrText: "128GB unlocked",
    });

    expect(sources).toContain("listingText");
    expect(sources).toContain("ocrText");
  });
});

describe("extractUrlIdentityHints", () => {
  it("decodes URL path segments for hints", () => {
    const hints = extractUrlIdentityHints(
      "https://www.ebay.com/itm/makita-lxt-drill-18v"
    );

    expect(hints).toContain("makita");
    expect(hints).toContain("ebay");
  });
});
