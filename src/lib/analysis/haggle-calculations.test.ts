import { describe, expect, it } from "vitest";
import {
  calculateFeesRepairsBuffer,
  calculateHaggleGuide,
  maxBuyPriceForRoi,
  rateAskingPrice,
} from "@/lib/analysis/haggle-calculations";
import type { DealAnalysis, DealInput } from "@/lib/types/deal";

const baseInput: DealInput = {
  itemName: "Vintage Camera",
  category: "Electronics",
  askingPrice: 120,
  condition: "Good",
  knownResaleValue: null,
  listingUrl: null,
  notes: "",
};

const baseAnalysis: DealAnalysis = {
  potentialProfit: 80,
  roiPercent: 66.7,
  riskScore: 4,
  flipScore: 7,
  timeToSellDays: 14,
  timeToSellLabel: "1–2 weeks",
  resaleEstimate: {
    low: 180,
    midpoint: 200,
    high: 220,
    source: "estimated",
    confidence: "medium",
  },
};

describe("maxBuyPriceForRoi", () => {
  it("calculates max buy for target ROI", () => {
    expect(maxBuyPriceForRoi(200, 25)).toBe(160);
    expect(maxBuyPriceForRoi(200, 50)).toBe(135);
    expect(maxBuyPriceForRoi(200, 100)).toBe(100);
  });

  it("returns 0 when net resale is non-positive", () => {
    expect(maxBuyPriceForRoi(0, 25)).toBe(0);
  });
});

describe("rateAskingPrice", () => {
  it("rates against ROI ceilings", () => {
    expect(rateAskingPrice(90, 100, 130, 160)).toBe("great");
    expect(rateAskingPrice(120, 100, 130, 160)).toBe("good");
    expect(rateAskingPrice(150, 100, 130, 160)).toBe("tight");
    expect(rateAskingPrice(200, 100, 130, 160)).toBe("overpriced");
  });
});

describe("calculateFeesRepairsBuffer", () => {
  it("scales with category and condition", () => {
    const electronics = calculateFeesRepairsBuffer(200, "Electronics", "Good");
    const poorFurniture = calculateFeesRepairsBuffer(
      200,
      "Furniture",
      "Poor"
    );
    expect(electronics).toBeGreaterThan(0);
    expect(poorFurniture).toBeGreaterThan(electronics);
  });
});

describe("calculateHaggleGuide", () => {
  it("returns negotiation targets and scripts", () => {
    const guide = calculateHaggleGuide(baseInput, baseAnalysis, 200);

    expect(guide.breakEvenBuyPrice).toBe(guide.netResaleValue);
    expect(guide.maxBuyPrice25Roi).toBeGreaterThan(guide.maxBuyPrice50Roi);
    expect(guide.maxBuyPrice50Roi).toBeGreaterThan(guide.maxBuyPrice100Roi);
    expect(guide.suggestedOpeningOffer).toBeLessThanOrEqual(
      guide.maxBuyPrice50Roi
    );
    expect(guide.walkAwayPrice).toBe(guide.maxBuyPrice25Roi);
    expect(guide.counterofferLow).toBe(guide.suggestedOpeningOffer);
    expect(guide.counterofferHigh).toBeLessThanOrEqual(guide.walkAwayPrice);
    expect(guide.askingPriceRating).toBe("tight");
    expect(guide.scripts.openingOffer).toContain("Vintage Camera");
    expect(guide.scripts.openingOffer).toContain("$");
  });

  it("marks overpriced asks correctly", () => {
    const guide = calculateHaggleGuide(
      { ...baseInput, askingPrice: 500 },
      { ...baseAnalysis, roiPercent: -50 },
      200
    );
    expect(guide.askingPriceRating).toBe("overpriced");
  });
});
