import { describe, expect, it } from "vitest";
import {
  getCompProgress,
  getCompProgressTier,
  resolveUseCompsForResale,
  shouldAutoEnableCompsEstimate,
} from "@/lib/analysis/comp-progress";
import type { ComparableSale } from "@/lib/types/comps";

function makeComp(
  price: number,
  listingType: "sold" | "listed" = "sold"
): ComparableSale {
  return {
    id: `comp-${price}-${listingType}`,
    title: `Comp ${price}`,
    platform: "eBay",
    price,
    condition: "Good",
    notes: "",
    listingType,
  };
}

describe("getCompProgressTier", () => {
  it("maps comp counts to progress tiers", () => {
    expect(getCompProgressTier(0, 0)).toBe("rough");
    expect(getCompProgressTier(1, 1)).toBe("market_informed");
    expect(getCompProgressTier(2, 2)).toBe("market_informed");
    expect(getCompProgressTier(3, 2)).toBe("strong");
    expect(getCompProgressTier(4, 4)).toBe("strong");
    expect(getCompProgressTier(5, 5)).toBe("high_confidence");
  });
});

describe("getCompProgress", () => {
  it("labels rough estimate with guidance at zero comps", () => {
    const progress = getCompProgress([]);

    expect(progress.label).toBe("Rough Estimate");
    expect(progress.compsNeededForEstimate).toBe(3);
    expect(progress.guidance).toContain("Need 3 more comps");
  });

  it("labels market informed for 1-2 comps", () => {
    const progress = getCompProgress([makeComp(50), makeComp(60, "listed")]);

    expect(progress.label).toBe("Market Informed");
    expect(progress.compsNeededForEstimate).toBe(1);
    expect(progress.guidance).toContain("Need 1 more comp");
  });

  it("labels strong estimate at 3-4 comps", () => {
    const progress = getCompProgress([
      makeComp(40),
      makeComp(50),
      makeComp(60),
    ]);

    expect(progress.label).toBe("Strong Estimate");
    expect(progress.compsNeededForHighConfidence).toBe(2);
    expect(progress.guidance).toContain("sold comp");
  });

  it("labels high confidence at 5+ sold comps", () => {
    const progress = getCompProgress([
      makeComp(40),
      makeComp(45),
      makeComp(50),
      makeComp(55),
      makeComp(60),
    ]);

    expect(progress.label).toBe("High Confidence");
    expect(progress.compsNeededForHighConfidence).toBe(0);
  });
});

describe("resolveUseCompsForResale", () => {
  it("auto-enables when 3+ comps and not manually off", () => {
    const comps = [makeComp(40), makeComp(50), makeComp(60)];
    expect(resolveUseCompsForResale(comps, false, false)).toBe(true);
  });

  it("keeps estimate off when manually overridden", () => {
    const comps = [makeComp(40), makeComp(50), makeComp(60)];
    expect(resolveUseCompsForResale(comps, true, false)).toBe(false);
  });

  it("disables when below minimum comps", () => {
    expect(resolveUseCompsForResale([makeComp(40)], false, true)).toBe(false);
  });
});

describe("shouldAutoEnableCompsEstimate", () => {
  it("auto-enables at 3+ comps when not manually off", () => {
    expect(
      shouldAutoEnableCompsEstimate(
        [makeComp(40), makeComp(50), makeComp(60)],
        false
      )
    ).toBe(true);
  });

  it("does not auto-enable when manually off", () => {
    expect(
      shouldAutoEnableCompsEstimate(
        [makeComp(40), makeComp(50), makeComp(60)],
        true
      )
    ).toBe(false);
  });
});
