import { describe, expect, it } from "vitest";
import {
  buildCategoryIntelligence,
  buildIntelligenceHaystack,
  DEAL_TO_INTELLIGENCE_CATEGORY,
} from "@/lib/analysis/category-intelligence";
import type { ComparableSale } from "@/lib/types/comps";
import type { DealInput } from "@/lib/types/deal";

function makeInput(overrides: Partial<DealInput> = {}): DealInput {
  return {
    itemName: "Test item",
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
    id: "comp-1",
    title,
    platform: "eBay",
    price: 120,
    condition: "Good",
    notes,
    listingType: "sold",
  };
}

describe("buildIntelligenceHaystack", () => {
  it("combines item name, notes, and comp text", () => {
    const haystack = buildIntelligenceHaystack(
      makeInput({
        itemName: "iPhone 13",
        notes: "icloud locked",
      }),
      [makeComp("iPhone 12", "cracked screen")]
    );

    expect(haystack).toContain("iphone 13");
    expect(haystack).toContain("icloud locked");
    expect(haystack).toContain("cracked screen");
  });
});

describe("DEAL_TO_INTELLIGENCE_CATEGORY", () => {
  it("maps app categories into eight intelligence buckets", () => {
    expect(DEAL_TO_INTELLIGENCE_CATEGORY.Electronics).toBe("Electronics");
    expect(DEAL_TO_INTELLIGENCE_CATEGORY["Tools & Hardware"]).toBe(
      "Tools & Hardware"
    );
    expect(DEAL_TO_INTELLIGENCE_CATEGORY["Vehicles & Parts"]).toBe("Vehicles");
    expect(DEAL_TO_INTELLIGENCE_CATEGORY["Home & Garden"]).toBe("Other");
  });
});

describe("buildCategoryIntelligence", () => {
  it("detects electronics activation lock and cracked screen", () => {
    const intel = buildCategoryIntelligence(
      makeInput({
        itemName: "iPhone 12",
        notes: "iCloud locked, cracked screen, no charger included",
      })
    );

    expect(intel.intelligenceCategory).toBe("Electronics");
    expect(intel.matchedRisks.some((s) => s.id === "activation-lock")).toBe(
      true
    );
    expect(intel.matchedPenalties.some((s) => s.id === "cracked-screen")).toBe(
      true
    );
    expect(intel.matchedPenalties.some((s) => s.id === "missing-charger")).toBe(
      true
    );
    expect(intel.riskAdjustment).toBeGreaterThan(0);
    expect(intel.confidenceAdjustment).not.toBe("none");
  });

  it("detects tools brushless boost and rust penalty", () => {
    const intel = buildCategoryIntelligence(
      makeInput({
        category: "Tools & Hardware",
        itemName: "Milwaukee M18 Fuel drill",
        notes: "some rust on chuck, no battery",
      })
    );

    expect(intel.matchedBoosters.some((s) => s.id === "brushless-boost")).toBe(
      true
    );
    expect(intel.matchedPenalties.some((s) => s.id === "rust-penalty")).toBe(
      true
    );
    expect(intel.matchedPenalties.some((s) => s.id === "missing-batteries")).toBe(
      true
    );
    expect(intel.negotiationLeverageNotes.length).toBeGreaterThan(0);
  });

  it("detects vehicle title and rust signals", () => {
    const intel = buildCategoryIntelligence(
      makeInput({
        category: "Vehicles & Parts",
        itemName: "2008 Honda Civic",
        notes: "salvage title, frame rust, 220k miles",
      })
    );

    expect(intel.matchedRisks.some((s) => s.id === "title-issue")).toBe(true);
    expect(intel.matchedPenalties.some((s) => s.id === "rust")).toBe(true);
    expect(intel.confidenceAdjustment).toBe("downgrade_to_low");
  });

  it("detects furniture smoke smell and brand boost", () => {
    const intel = buildCategoryIntelligence(
      makeInput({
        category: "Furniture",
        itemName: "West Elm leather sofa",
        notes: "smoke smell, pickup only upstairs",
      })
    );

    expect(intel.matchedBoosters.some((s) => s.id === "brand-boost")).toBe(
      true
    );
    expect(intel.matchedPenalties.some((s) => s.id === "smoke-smell")).toBe(
      true
    );
    expect(intel.matchedRisks.some((s) => s.id === "pickup-difficulty")).toBe(
      true
    );
  });

  it("detects appliance untested and missing parts", () => {
    const intel = buildCategoryIntelligence(
      makeInput({
        category: "Appliances",
        itemName: "Whirlpool washer",
        notes: "untested, missing hose",
      })
    );

    expect(intel.matchedRisks.some((s) => s.id === "untested")).toBe(true);
    expect(intel.matchedPenalties.some((s) => s.id === "missing-parts")).toBe(
      true
    );
    expect(intel.inspectionChecklist.some((item) => /cycle/i.test(item))).toBe(
      true
    );
  });

  it("detects collectibles authenticity and grading boost", () => {
    const intel = buildCategoryIntelligence(
      makeInput({
        category: "Collectibles & Antiques",
        itemName: "Pokemon Charizard",
        notes: "PSA 9 graded, original box",
      })
    );

    expect(intel.matchedBoosters.some((s) => s.id === "box-manuals")).toBe(
      true
    );
    expect(intel.inspectionChecklist.some((item) => /authentic/i.test(item))).toBe(
      true
    );
  });

  it("detects clothing NWT and stain penalty", () => {
    const intel = buildCategoryIntelligence(
      makeInput({
        category: "Clothing & Accessories",
        itemName: "Patagonia jacket",
        notes: "NWT but small stain on sleeve",
      })
    );

    expect(intel.matchedBoosters.some((s) => s.id === "nwt-boost")).toBe(true);
    expect(intel.matchedPenalties.some((s) => s.id === "stains-holes")).toBe(
      true
    );
    expect(intel.matchedBoosters.some((s) => s.id === "designer-boost")).toBe(
      true
    );
  });

  it("uses comp titles for signal detection", () => {
    const intel = buildCategoryIntelligence(
      makeInput({
        category: "Tools & Hardware",
        itemName: "Cordless drill",
        notes: "",
      }),
      [makeComp("Dewalt XR combo", "brushless, includes battery")]
    );

    expect(intel.matchedBoosters.some((s) => s.id === "brushless-boost")).toBe(
      true
    );
    expect(intel.matchedBoosters.some((s) => s.id === "includes-battery")).toBe(
      true
    );
  });

  it("provides default checklist when no signals match", () => {
    const intel = buildCategoryIntelligence(
      makeInput({
        category: "Other",
        itemName: "Mystery lot",
        notes: "misc items",
      })
    );

    expect(intel.intelligenceCategory).toBe("Other");
    expect(intel.inspectionChecklist.length).toBeGreaterThanOrEqual(3);
    expect(intel.advice.some((line) => /no category-specific/i.test(line))).toBe(
      true
    );
  });
});
