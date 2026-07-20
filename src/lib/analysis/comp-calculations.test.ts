import { describe, expect, it } from "vitest";
import {
  buildResaleEstimateFromComps,
  calculateCompConfidence,
  calculateCompSummary,
  canUseCompsAsEstimate,
} from "@/lib/analysis/comp-calculations";
import type { ComparableSale } from "@/lib/types/comps";

function makeComp(
  price: number,
  listingType: "sold" | "listed" = "sold",
  id = String(price)
): ComparableSale {
  return {
    id,
    title: `Comp ${id}`,
    platform: "eBay",
    price,
    condition: "Good",
    notes: "",
    listingType,
  };
}

describe("calculateCompSummary", () => {
  it("calculates average, median, and range", () => {
    const summary = calculateCompSummary([
      makeComp(40, "sold", "1"),
      makeComp(50, "sold", "2"),
      makeComp(60, "sold", "3"),
    ]);

    expect(summary).not.toBeNull();
    expect(summary?.count).toBe(3);
    expect(summary?.average).toBe(50);
    expect(summary?.median).toBe(50);
    expect(summary?.low).toBe(40);
    expect(summary?.high).toBe(60);
  });

  it("ignores zero-price comps", () => {
    const summary = calculateCompSummary([
      makeComp(0, "sold", "1"),
      makeComp(45, "sold", "2"),
      makeComp(55, "sold", "3"),
      makeComp(50, "sold", "4"),
    ]);

    expect(summary?.count).toBe(3);
  });
});

describe("calculateCompConfidence", () => {
  it("returns medium for 3-4 comps", () => {
    expect(calculateCompConfidence(3, 3, 0)).toBe("medium");
    expect(calculateCompConfidence(4, 4, 0)).toBe("medium");
  });

  it("returns high for 5+ sold comps", () => {
    expect(calculateCompConfidence(5, 5, 0)).toBe("high");
    expect(calculateCompConfidence(6, 5, 1)).toBe("high");
  });

  it("downgrades when mostly listed", () => {
    expect(calculateCompConfidence(4, 1, 3)).toBe("low");
    expect(calculateCompConfidence(6, 2, 4)).toBe("low");
    expect(calculateCompConfidence(11, 5, 6)).toBe("medium");
  });
});

describe("canUseCompsAsEstimate", () => {
  it("requires at least 3 valid comps", () => {
    expect(canUseCompsAsEstimate([makeComp(40), makeComp(50)])).toBe(false);
    expect(
      canUseCompsAsEstimate([makeComp(40), makeComp(50), makeComp(60)])
    ).toBe(true);
  });
});

describe("buildResaleEstimateFromComps", () => {
  it("labels source as comps and uses median", () => {
    const summary = calculateCompSummary([
      makeComp(30, "sold", "1"),
      makeComp(50, "sold", "2"),
      makeComp(100, "sold", "3"),
    ]);

    const estimate = buildResaleEstimateFromComps(summary!);
    expect(estimate.source).toBe("comps");
    expect(estimate.midpoint).toBe(50);
    expect(estimate.low).toBe(30);
    expect(estimate.high).toBe(100);
  });
});
