import type {
  DealAnalysis,
  DealCategory,
  DealCondition,
  DealInput,
} from "@/lib/types/deal";

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

export function calculatePotentialProfit(input: DealInput): number {
  return input.estimatedResaleValue - input.askingPrice;
}

export function calculateRoiPercent(input: DealInput): number {
  if (input.askingPrice <= 0) {
    return input.estimatedResaleValue > 0 ? 100 : 0;
  }
  const profit = calculatePotentialProfit(input);
  return (profit / input.askingPrice) * 100;
}

export function calculateRiskScore(input: DealInput): number {
  const profit = calculatePotentialProfit(input);
  const roi = calculateRoiPercent(input);

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

  return clamp(Math.round(risk), 1, 10);
}

export function calculateFlipScore(input: DealInput): number {
  const profit = calculatePotentialProfit(input);
  const roi = calculateRoiPercent(input);

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

export function calculateTimeToSellDays(input: DealInput): number {
  const base = CATEGORY_BASE_DAYS[input.category];
  const conditionMultiplier = CONDITION_TIME_MULTIPLIER[input.condition];

  let days = base * conditionMultiplier;

  if (input.askingPrice > 500) days *= 1.2;
  if (input.askingPrice > 1000) days *= 1.15;

  const profit = calculatePotentialProfit(input);
  if (profit > 100) days *= 0.9;

  return Math.round(days);
}

export function analyzeDeal(input: DealInput): DealAnalysis {
  const timeToSellDays = calculateTimeToSellDays(input);

  return {
    potentialProfit: calculatePotentialProfit(input),
    roiPercent: calculateRoiPercent(input),
    riskScore: calculateRiskScore(input),
    flipScore: calculateFlipScore(input),
    timeToSellDays,
    timeToSellLabel: formatTimeToSell(timeToSellDays),
  };
}
