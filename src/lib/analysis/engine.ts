import { buildCategoryIntelligence } from "@/lib/analysis/category-intelligence";
import { resolveDeal } from "@/lib/analysis/resale-estimate";
import type {
  DealAnalysis,
  DealCategory,
  DealCondition,
  DealInput,
  ResolvedDeal,
} from "@/lib/types/deal";
import type { AnalysisOptions } from "@/lib/types/comps";

const CONDITION_RISK: Record<DealCondition, number> = {
  New: 0,
  "Like New": 0.5,
  Good: 1,
  Fair: 2,
  Poor: 3.5,
};

const CONDITION_FLIP_BONUS: Record<DealCondition, number> = {
  New: 2,
  "Like New": 1.5,
  Good: 1,
  Fair: 0,
  Poor: -1,
};

const CATEGORY_RISK: Record<DealCategory, number> = {
  Electronics: 1.5,
  Furniture: 1,
  "Vehicles & Parts": 2.5,
  "Clothing & Accessories": 1,
  "Collectibles & Antiques": 2.5,
  "Tools & Hardware": 0.5,
  "Home & Garden": 1,
  "Sports & Outdoors": 1,
  "Toys & Games": 1,
  "Books & Media": 0.5,
  Appliances: 1.5,
  Other: 1.5,
};

const CATEGORY_LIQUIDITY: Record<DealCategory, number> = {
  Electronics: 0.9,
  Furniture: 0.5,
  "Vehicles & Parts": 0.4,
  "Clothing & Accessories": 0.7,
  "Collectibles & Antiques": 0.3,
  "Tools & Hardware": 0.8,
  "Home & Garden": 0.6,
  "Sports & Outdoors": 0.7,
  "Toys & Games": 0.75,
  "Books & Media": 0.65,
  Appliances: 0.55,
  Other: 0.5,
};

const CATEGORY_BASE_DAYS: Record<DealCategory, number> = {
  Electronics: 14,
  Furniture: 45,
  "Vehicles & Parts": 60,
  "Clothing & Accessories": 21,
  "Collectibles & Antiques": 90,
  "Tools & Hardware": 21,
  "Home & Garden": 35,
  "Sports & Outdoors": 28,
  "Toys & Games": 18,
  "Books & Media": 25,
  Appliances: 40,
  Other: 30,
};

const CONDITION_TIME_MULTIPLIER: Record<DealCondition, number> = {
  New: 0.8,
  "Like New": 0.9,
  Good: 1,
  Fair: 1.3,
  Poor: 1.8,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatTimeToSell(days: number): string {
  if (days <= 7) return "Under 1 week";
  if (days <= 14) return "1–2 weeks";
  if (days <= 30) return "2–4 weeks";
  if (days <= 60) return "1–2 months";
  if (days <= 90) return "2–3 months";
  return "3+ months";
}

function calculatePotentialProfit(
  askingPrice: number,
  effectiveResaleValue: number
): number {
  return effectiveResaleValue - askingPrice;
}

function calculateRoiPercent(
  askingPrice: number,
  effectiveResaleValue: number
): number {
  if (askingPrice <= 0) {
    return effectiveResaleValue > 0 ? 100 : 0;
  }
  const profit = calculatePotentialProfit(askingPrice, effectiveResaleValue);
  return (profit / askingPrice) * 100;
}

function calculateRiskScore(
  resolved: ResolvedDeal,
  categoryRiskAdjustment = 0
): number {
  const { input, effectiveResaleValue, resaleEstimate } = resolved;
  const profit = calculatePotentialProfit(input.askingPrice, effectiveResaleValue);
  const roi = calculateRoiPercent(input.askingPrice, effectiveResaleValue);

  if (profit <= 0) return 10;

  let risk =
    CONDITION_RISK[input.condition] + CATEGORY_RISK[input.category];

  if (roi < 10) risk += 3;
  else if (roi < 20) risk += 2;
  else if (roi < 35) risk += 1;

  if (input.askingPrice > 500) risk += 1;
  if (input.askingPrice > 1500) risk += 1;

  if (profit < 25) risk += 1.5;
  if (profit < 10) risk += 1;

  if (resaleEstimate.source === "estimated") {
    if (resaleEstimate.confidence === "low") risk += 1;
    else if (resaleEstimate.confidence === "medium") risk += 0.5;
  } else if (resaleEstimate.source === "comps") {
    if (resaleEstimate.confidence === "low") risk += 0.5;
  }

  risk += categoryRiskAdjustment;

  return clamp(Math.round(risk), 1, 10);
}

function calculateFlipScore(resolved: ResolvedDeal): number {
  const { input, effectiveResaleValue } = resolved;
  const profit = calculatePotentialProfit(input.askingPrice, effectiveResaleValue);
  const roi = calculateRoiPercent(input.askingPrice, effectiveResaleValue);

  if (profit <= 0) return 1;

  let score = 3;

  if (roi >= 100) score += 3;
  else if (roi >= 60) score += 2.5;
  else if (roi >= 40) score += 2;
  else if (roi >= 25) score += 1.5;
  else if (roi >= 15) score += 1;
  else score += 0.5;

  score += CONDITION_FLIP_BONUS[input.condition];
  score += CATEGORY_LIQUIDITY[input.category] * 2;

  if (profit >= 200) score += 1;
  else if (profit >= 75) score += 0.5;

  return clamp(Math.round(score), 1, 10);
}

function calculateTimeToSellDays(resolved: ResolvedDeal): number {
  const { input, effectiveResaleValue } = resolved;
  const base = CATEGORY_BASE_DAYS[input.category];
  const conditionMultiplier = CONDITION_TIME_MULTIPLIER[input.condition];

  let days = base * conditionMultiplier;

  if (input.askingPrice > 500) days *= 1.2;
  if (input.askingPrice > 1000) days *= 1.15;

  const profit = calculatePotentialProfit(input.askingPrice, effectiveResaleValue);
  if (profit > 100) days *= 0.9;

  return Math.round(days);
}

export function analyzeResolved(
  resolved: ResolvedDeal,
  categoryRiskAdjustment = 0
): DealAnalysis {
  const { input, effectiveResaleValue, resaleEstimate } = resolved;
  const timeToSellDays = calculateTimeToSellDays(resolved);

  return {
    potentialProfit: calculatePotentialProfit(
      input.askingPrice,
      effectiveResaleValue
    ),
    roiPercent: calculateRoiPercent(input.askingPrice, effectiveResaleValue),
    riskScore: calculateRiskScore(resolved, categoryRiskAdjustment),
    flipScore: calculateFlipScore(resolved),
    timeToSellDays,
    timeToSellLabel: formatTimeToSell(timeToSellDays),
    resaleEstimate,
  };
}

export function analyzeDeal(
  input: DealInput,
  options?: AnalysisOptions
): DealAnalysis {
  const categoryIntel =
    options?.categoryIntel ??
    buildCategoryIntelligence(input, options?.comps);
  const resolved = resolveDeal(input, { ...options, categoryIntel });

  return analyzeResolved(resolved, categoryIntel.riskAdjustment);
}

/** @deprecated Use effectiveResaleValue from resolveDeal() */
export function calculatePotentialProfitFromInput(input: DealInput): number {
  const resolved = resolveDeal(input);
  return resolved.effectiveResaleValue - input.askingPrice;
}
