import type { ComparableSale, CompSummary } from "@/lib/types/comps";
import { MIN_COMPS_FOR_ESTIMATE } from "@/lib/types/comps";
import type { EstimateConfidence, ResaleEstimate } from "@/lib/types/deal";

function roundPrice(value: number): number {
  if (value < 50) return Math.round(value);
  if (value < 200) return Math.round(value / 5) * 5;
  return Math.round(value / 10) * 10;
}

function median(sortedPrices: number[]): number {
  const mid = Math.floor(sortedPrices.length / 2);
  if (sortedPrices.length % 2 === 0) {
    return (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;
  }
  return sortedPrices[mid];
}

export function calculateCompConfidence(
  count: number,
  soldCount: number,
  listedCount: number
): EstimateConfidence {
  if (count < MIN_COMPS_FOR_ESTIMATE) return "low";

  let confidence: EstimateConfidence;
  if (soldCount >= 5) {
    confidence = "high";
  } else {
    confidence = "medium";
  }

  const mostlyListed = listedCount > soldCount;
  if (mostlyListed) {
    if (confidence === "high") return "medium";
    if (confidence === "medium") return "low";
  }

  return confidence;
}

export function calculateCompSummary(
  comps: ComparableSale[]
): CompSummary | null {
  const valid = comps.filter((comp) => comp.price > 0);
  if (valid.length === 0) return null;

  const prices = valid.map((comp) => comp.price).sort((a, b) => a - b);
  const soldCount = valid.filter((comp) => comp.listingType === "sold").length;
  const listedCount = valid.length - soldCount;

  const average =
    prices.reduce((sum, price) => sum + price, 0) / prices.length;

  return {
    count: valid.length,
    average: roundPrice(average),
    median: roundPrice(median(prices)),
    low: roundPrice(prices[0]),
    high: roundPrice(prices[prices.length - 1]),
    confidence: calculateCompConfidence(valid.length, soldCount, listedCount),
    soldCount,
    listedCount,
  };
}

export function canUseCompsAsEstimate(comps: ComparableSale[]): boolean {
  return comps.filter((comp) => comp.price > 0).length >= MIN_COMPS_FOR_ESTIMATE;
}

export function buildResaleEstimateFromComps(
  summary: CompSummary
): ResaleEstimate {
  return {
    low: summary.low,
    midpoint: summary.median,
    high: summary.high,
    source: "comps",
    confidence: summary.confidence,
  };
}
