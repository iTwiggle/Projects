import { describe, expect, it } from "vitest";
import { getDealViewModel, getPreviewViewModel } from "@/lib/deal-view-model";
import type { ComparableSale } from "@/lib/types/comps";
import type { SavedDeal } from "@/lib/types/deal";

function makeComp(price: number, listingType: "sold" | "listed" = "sold"): ComparableSale {
  return {
    id: `comp-${price}`,
    title: `Comp ${price}`,
    platform: "eBay",
    price,
    condition: "Good",
    notes: "",
    listingType,
  };
}

function makeSavedDeal(overrides: Partial<SavedDeal> = {}): SavedDeal {
  const base: SavedDeal = {
    itemName: "Test Item",
    category: "Electronics",
    askingPrice: 100,
    condition: "Good",
    knownResaleValue: null,
    notes: "",
    id: "deal-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    comps: [],
    useCompsForResale: false,
    analysis: {
      potentialProfit: 0,
      roiPercent: 0,
      riskScore: 5,
      flipScore: 5,
      timeToSellDays: 14,
      timeToSellLabel: "1–2 weeks",
      resaleEstimate: {
        low: 100,
        midpoint: 150,
        high: 200,
        source: "estimated",
        confidence: "low",
      },
    },
    verdict: {
      type: "caution",
      label: "Proceed With Caution",
      emoji: "⚠️",
      reasoning: ["Stale cached reason"],
    },
  };

  return { ...base, ...overrides };
}

describe("getDealViewModel", () => {
  it("recomputes analysis and verdict instead of using cached values", () => {
    const deal = makeSavedDeal({
      askingPrice: 50,
      analysis: {
        potentialProfit: 9999,
        roiPercent: 9999,
        riskScore: 1,
        flipScore: 10,
        timeToSellDays: 7,
        timeToSellLabel: "Under 1 week",
        resaleEstimate: {
          low: 9999,
          midpoint: 9999,
          high: 9999,
          source: "manual",
          confidence: "high",
        },
      },
      verdict: {
        type: "approved",
        label: "Goblin Approved",
        emoji: "✅",
        reasoning: ["Cached only"],
      },
    });

    const vm = getDealViewModel(deal);

    expect(vm.analysis.potentialProfit).not.toBe(9999);
    expect(vm.analysis.resaleEstimate.source).toBe("estimated");
    expect(vm.verdict.reasoning).not.toContain("Cached only");
  });

  it("uses comps when enabled with 3+ valid comps", () => {
    const deal = makeSavedDeal({
      comps: [makeComp(40), makeComp(50), makeComp(60)],
      useCompsForResale: true,
    });

    const vm = getDealViewModel(deal);

    expect(vm.analysis.resaleEstimate.source).toBe("comps");
    expect(vm.analysis.resaleEstimate.midpoint).toBe(50);
    expect(vm.display.resaleSourceLabel).toBe("User comps");
    expect(vm.compSummary?.count).toBe(3);
  });

  it("prefers manual resale over comps and warns", () => {
    const deal = makeSavedDeal({
      knownResaleValue: 200,
      comps: [makeComp(40), makeComp(50), makeComp(60)],
      useCompsForResale: true,
    });

    const vm = getDealViewModel(deal);

    expect(vm.analysis.resaleEstimate.source).toBe("manual");
    expect(vm.analysis.resaleEstimate.midpoint).toBe(200);
    expect(vm.display.resaleSourceLabel).toBe("Manual resale value");
    expect(
      vm.display.warnings.some((w) => w.includes("Manual resale value overrides"))
    ).toBe(true);
  });

  it("provides display labels and warnings for rough estimates", () => {
    const vm = getDealViewModel(makeSavedDeal());

    expect(vm.display.resaleSourceLabel).toBe("Fast rough estimate");
    expect(vm.display.confidenceLabel).toMatch(/confidence/i);
    expect(vm.display.verdictBadgeClassName).toContain(vm.verdict.type === "approved" ? "emerald" : "amber");
    expect(vm.display.warnings.some((w) => w.includes("Fast triage"))).toBe(
      true
    );
  });

  it("includes haggle guidance derived from analysis", () => {
    const vm = getDealViewModel(makeSavedDeal({ askingPrice: 100 }));

    expect(vm.haggle.effectiveResaleValue).toBe(
      vm.resolved.effectiveResaleValue
    );
    expect(vm.haggle.scripts.openingOffer).toContain("Test Item");
    expect(["great", "good", "tight", "overpriced"]).toContain(
      vm.haggle.askingPriceRating
    );
  });

  it("getPreviewViewModel matches saved deal view for same inputs", () => {
    const input = {
      itemName: "Preview Item",
      category: "Electronics" as const,
      askingPrice: 80,
      condition: "Good" as const,
      knownResaleValue: null,
      notes: "",
    };
    const comps = [makeComp(100), makeComp(120), makeComp(140)];

    const preview = getPreviewViewModel(input, comps, true);
    const saved = getDealViewModel(
      makeSavedDeal({
        ...input,
        comps,
        useCompsForResale: true,
      })
    );

    expect(preview.analysis.resaleEstimate).toEqual(
      saved.analysis.resaleEstimate
    );
    expect(preview.display.resaleSourceLabel).toBe("User comps");
  });

  it("warns when mostly listed comps drive the estimate", () => {
    const deal = makeSavedDeal({
      comps: [
        makeComp(40, "listed"),
        makeComp(50, "listed"),
        makeComp(60, "listed"),
        makeComp(70, "sold"),
      ],
      useCompsForResale: true,
    });

    const vm = getDealViewModel(deal);

    expect(
      vm.display.warnings.some((w) => w.includes("Mostly listed comps"))
    ).toBe(true);
  });
});
