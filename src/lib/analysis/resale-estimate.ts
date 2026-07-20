import {
  applyConfidenceAdjustment,
  buildCategoryIntelligence,
} from "@/lib/analysis/category-intelligence";
import {
  getItemIdentity,
  upgradeEstimateConfidenceFromIdentity,
} from "@/lib/analysis/item-identity";
import {
  buildResaleEstimateFromComps,
  calculateCompSummary,
  canUseCompsAsEstimate,
} from "@/lib/analysis/comp-calculations";
import type {
  DealCategory,
  DealCondition,
  DealInput,
  EstimateConfidence,
  ResolvedDeal,
  ResaleEstimate,
} from "@/lib/types/deal";
import { hasManualResaleValue } from "@/lib/types/deal";
import type { AnalysisOptions } from "@/lib/types/comps";

const CATEGORY_RESALE_MULTIPLIER: Record<DealCategory, number> = {
  Electronics: 1.55,
  Furniture: 1.32,
  "Vehicles & Parts": 1.45,
  "Clothing & Accessories": 1.4,
  "Collectibles & Antiques": 1.65,
  "Tools & Hardware": 1.48,
  "Home & Garden": 1.38,
  "Sports & Outdoors": 1.42,
  "Toys & Games": 1.45,
  "Books & Media": 1.28,
  Appliances: 1.4,
  Other: 1.35,
};

const CATEGORY_FLOOR: Record<DealCategory, number> = {
  Electronics: 35,
  Furniture: 40,
  "Vehicles & Parts": 75,
  "Clothing & Accessories": 15,
  "Collectibles & Antiques": 25,
  "Tools & Hardware": 20,
  "Home & Garden": 20,
  "Sports & Outdoors": 25,
  "Toys & Games": 12,
  "Books & Media": 8,
  Appliances: 45,
  Other: 15,
};

const CONDITION_RESALE_FACTOR: Record<DealCondition, number> = {
  New: 1.12,
  "Like New": 1.06,
  Good: 1,
  Fair: 0.82,
  Poor: 0.62,
};

const KNOWN_BRANDS = [
  "apple",
  "samsung",
  "sony",
  "nintendo",
  "dyson",
  "dewalt",
  "makita",
  "milwaukee",
  "le creuset",
  "kitchenaid",
  "vitamix",
  "patagonia",
  "north face",
  "nike",
  "adidas",
  "bose",
  "lg",
  "hp",
  "dell",
  "lenovo",
  "canon",
  "nikon",
  "festool",
  "ridgid",
  "weber",
  "yeti",
  "stanley",
  "craftsman",
  "snap-on",
  "harley",
  "honda",
  "toyota",
  "ford",
  "shimano",
  "callaway",
  "titleist",
];

const MODEL_PATTERN =
  /\b(model\s*#?\s*)?[a-z]{0,3}\d{2,}[a-z0-9-]*\b|\b(19|20)\d{2}\b/i;

const COMP_HINT_PATTERN =
  /\b(sold|comps?|ebay|mercari|retail|msrp|market|worth|valued at)\b/i;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundPrice(value: number): number {
  if (value < 50) return Math.round(value);
  if (value < 200) return Math.round(value / 5) * 5;
  return Math.round(value / 10) * 10;
}

function scoreItemDetail(
  input: DealInput,
  options?: AnalysisOptions
): number {
  const name = input.itemName.toLowerCase();
  const notes = input.notes.toLowerCase();
  const haystack = `${name} ${notes}`;
  let score = 0;

  if (KNOWN_BRANDS.some((brand) => haystack.includes(brand))) score += 2;
  if (MODEL_PATTERN.test(input.itemName) || MODEL_PATTERN.test(input.notes)) {
    score += 2;
  }
  if (input.itemName.trim().split(/\s+/).length >= 4) score += 1;
  if (input.notes.trim().length >= 30) score += 1;
  if (COMP_HINT_PATTERN.test(input.notes)) score += 2;

  const identity =
    options?.itemIdentity ??
    getItemIdentity(input, options?.comps, options?.identitySources);
  if (identity.confidence === "high") score += 2;
  else if (identity.confidence === "medium") score += 1;

  return score;
}

function confidenceFromDetailScore(score: number): EstimateConfidence {
  if (score >= 4) return "medium";
  return "low";
}

function spreadForConfidence(
  midpoint: number,
  confidence: EstimateConfidence
): { low: number; high: number } {
  if (confidence === "high") {
    return { low: midpoint, high: midpoint };
  }
  if (confidence === "medium") {
    return {
      low: roundPrice(midpoint * 0.85),
      high: roundPrice(midpoint * 1.15),
    };
  }
  return {
    low: roundPrice(midpoint * 0.72),
    high: roundPrice(midpoint * 1.28),
  };
}

function estimateFromSignals(
  input: DealInput,
  options?: AnalysisOptions
): ResaleEstimate {
  const categoryMultiplier = CATEGORY_RESALE_MULTIPLIER[input.category];
  const conditionFactor = CONDITION_RESALE_FACTOR[input.condition];
  const itemIdentity =
    options?.itemIdentity ??
    getItemIdentity(input, options?.comps, options?.identitySources);
  const detailScore = scoreItemDetail(input, { ...options, itemIdentity });
  const categoryIntel =
    options?.categoryIntel ??
    buildCategoryIntelligence(input, options?.comps, itemIdentity);
  const baseConfidence = confidenceFromDetailScore(detailScore);
  const adjustedConfidence = applyConfidenceAdjustment(
    baseConfidence,
    categoryIntel.confidenceAdjustment
  );
  const confidence = upgradeEstimateConfidenceFromIdentity(
    adjustedConfidence,
    itemIdentity
  );

  const anchor =
    input.askingPrice > 0
      ? input.askingPrice
      : CATEGORY_FLOOR[input.category];

  let midpoint = anchor * categoryMultiplier * conditionFactor;

  if (detailScore >= 4) midpoint *= 1.06;
  if (detailScore <= 1) midpoint *= 0.94;

  midpoint = clamp(
    roundPrice(midpoint),
    CATEGORY_FLOOR[input.category],
    Math.max(CATEGORY_FLOOR[input.category] * 20, 50000)
  );

  const { low, high } = spreadForConfidence(midpoint, confidence);

  return {
    low,
    midpoint,
    high,
    source: "estimated",
    confidence,
  };
}

export function buildResaleEstimate(
  input: DealInput,
  options?: AnalysisOptions
): ResaleEstimate {
  if (hasManualResaleValue(input)) {
    const value = input.knownResaleValue as number;
    return {
      low: value,
      midpoint: value,
      high: value,
      source: "manual",
      confidence: "high",
    };
  }

  const itemIdentity =
    options?.itemIdentity ??
    getItemIdentity(input, options?.comps, options?.identitySources);
  const categoryIntel =
    options?.categoryIntel ??
    buildCategoryIntelligence(input, options?.comps, itemIdentity);

  if (
    options?.useCompsForResale &&
    options.comps &&
    canUseCompsAsEstimate(options.comps)
  ) {
    const summary = calculateCompSummary(options.comps);
    if (summary) {
      const estimate = buildResaleEstimateFromComps(summary);
      let confidence = estimate.confidence;
      if (categoryIntel.confidenceAdjustment !== "none") {
        confidence = applyConfidenceAdjustment(
          confidence,
          categoryIntel.confidenceAdjustment
        );
      }
      return {
        ...estimate,
        confidence: upgradeEstimateConfidenceFromIdentity(
          confidence,
          itemIdentity
        ),
      };
    }
  }

  return estimateFromSignals(input, {
    ...options,
    categoryIntel,
    itemIdentity,
  });
}

export function resolveDeal(
  input: DealInput,
  options?: AnalysisOptions
): ResolvedDeal {
  const resaleEstimate = buildResaleEstimate(input, options);

  return {
    input,
    resaleEstimate,
    effectiveResaleValue: resaleEstimate.midpoint,
  };
}

export function withEffectiveResale(
  resolved: ResolvedDeal,
  effectiveResaleValue: number
): ResolvedDeal {
  const ratio =
    resolved.effectiveResaleValue > 0
      ? effectiveResaleValue / resolved.effectiveResaleValue
      : 1;

  return {
    ...resolved,
    effectiveResaleValue,
    resaleEstimate: {
      ...resolved.resaleEstimate,
      midpoint: effectiveResaleValue,
      low: roundPrice(resolved.resaleEstimate.low * ratio),
      high: roundPrice(resolved.resaleEstimate.high * ratio),
    },
  };
}

export function getResaleSourceLabel(source: ResaleEstimate["source"]): string {
  if (source === "manual") return "Manual resale value";
  if (source === "comps") return "User comps";
  return "Fast rough estimate";
}

export function getConfidenceLabel(
  confidence: EstimateConfidence
): string {
  const labels: Record<EstimateConfidence, string> = {
    low: "Low confidence",
    medium: "Medium confidence",
    high: "High confidence",
  };
  return labels[confidence];
}
