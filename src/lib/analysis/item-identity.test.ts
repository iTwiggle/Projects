import { describe, expect, it } from "vitest";
import {
  buildIdentityHaystack,
  getItemIdentity,
  getItemIdentityFromText,
  getIdentityRiskAdjustment,
  upgradeEstimateConfidenceFromIdentity,
} from "@/lib/analysis/item-identity";
import type { ComparableSale } from "@/lib/types/comps";
import type { DealInput } from "@/lib/types/deal";
import {
  EMPTY_ITEM_IDENTITY,
  IDENTITY_CONFLICT_WARNING,
} from "@/lib/types/item-identity";

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

function makeComp(title: string, notes = ""): ComparableSale {
  return {
    id: "c1",
    title,
    platform: "eBay",
    price: 120,
    condition: "Good",
    notes,
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
    expect(identity.evidence.matchCount).toBe(1);
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
});

describe("getItemIdentity — strong evidence", () => {
  it("merges item name, notes, comps, URL, and listing text with high confidence", () => {
    const identity = getItemIdentity(
      makeInput({
        category: "Tools & Hardware",
        itemName: "DeWalt XR impact driver",
        notes: "20V Max brushless",
        listingUrl: "https://www.ebay.com/itm/dewalt-xr-impact-driver",
      }),
      [makeComp("DeWalt XR 20V Max impact")],
      { listingText: "DeWalt cordless drill" }
    );

    expect(identity.brand).toBe("DeWalt");
    expect(identity.confidence).toMatch(/medium|high/);
    expect(identity.evidence.matchCount).toBeGreaterThanOrEqual(2);
    expect(identity.sources).toEqual(
      expect.arrayContaining(["Item Name", "Notes", "Comparable Sales", "URL"])
    );
    expect(identity.hasConflict).toBe(false);
  });
});

describe("getItemIdentity — OCR-only detection", () => {
  it("detects brand from cleaned OCR text when item name is generic", () => {
    const identity = getItemIdentity(
      makeInput({
        category: "Electronics",
        itemName: "Phone for sale",
      }),
      [],
      {
        ocrText: "Sams ung Galaxy S22 128GB unlocked",
        listingText: "Samsung Galaxy S22 128GB",
      }
    );

    expect(identity.brand).toBe("Samsung");
    expect(identity.evidence.matchedSources).toContain("ocr");
    expect(identity.evidence.matchedSources).toContain("listingText");
  });
});

describe("getItemIdentity — conflicting brands", () => {
  it("detects conflicts, clears brand, downgrades confidence, and warns", () => {
    const identity = getItemIdentity(
      makeInput({
        category: "Electronics",
        itemName: "Samsung Galaxy S22",
        notes: "Apple iPhone 13 Pro",
      })
    );

    expect(identity.hasConflict).toBe(true);
    expect(identity.evidence.conflictCount).toBeGreaterThan(0);
    expect(identity.brand).toBeNull();
    expect(identity.confidence).toBe("low");
    expect(identity.warnings).toContain(IDENTITY_CONFLICT_WARNING);
  });
});

describe("getItemIdentity — weak evidence", () => {
  it("returns low confidence for brand-only URL hint", () => {
    const identity = getItemIdentity(
      makeInput({
        category: "Electronics",
        itemName: "Electronics lot",
        listingUrl: "https://www.ebay.com/itm/dell-laptop",
      })
    );

    expect(identity.brand).toBe("Dell");
    expect(identity.confidence).toBe("low");
    expect(identity.warnings).toContain(
      "Limited identity evidence — treat as uncertain"
    );
  });
});

describe("getItemIdentity — unknown fallback", () => {
  it("returns empty identity for unsupported categories", () => {
    const identity = getItemIdentity(
      makeInput({ category: "Books & Media", itemName: "Harry Potter set" })
    );

    expect(identity.brand).toBeNull();
    expect(identity.displayLabel).toBe(EMPTY_ITEM_IDENTITY.displayLabel);
    expect(identity.evidence.matchCount).toBe(0);
  });

  it("prefers unknown over incorrect when signals conflict on model", () => {
    const identity = getItemIdentity(
      makeInput({
        category: "Electronics",
        itemName: "iPhone 13 Pro",
        notes: "Galaxy S22 unlocked",
      })
    );

    expect(identity.hasConflict).toBe(true);
    expect(identity.model).toBeNull();
    expect(identity.confidence).toBe("low");
  });
});

describe("confidence scoring helpers", () => {
  it("upgrades estimate confidence when identity is high and uncontested", () => {
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

  it("does not upgrade estimate confidence when identity has conflicts", () => {
    const identity = getItemIdentity(
      makeInput({
        category: "Electronics",
        itemName: "Samsung Galaxy",
        notes: "Apple iPhone",
      })
    );

    expect(upgradeEstimateConfidenceFromIdentity("low", identity)).toBe("low");
  });

  it("increases risk when identity signals conflict", () => {
    const identity = getItemIdentity(
      makeInput({
        category: "Electronics",
        itemName: "Samsung phone",
        notes: "Apple iPhone",
      })
    );

    expect(getIdentityRiskAdjustment(identity)).toBeGreaterThan(0);
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
  it("includes cleaned OCR and listing text buckets", () => {
    const { sources } = buildIdentityHaystack(makeInput(), [], {
      listingText: "Samsung Galaxy S22",
      ocrText: "128GB unlocked",
    });

    expect(sources).toContain("listingText");
    expect(sources).toContain("ocr");
  });
});
