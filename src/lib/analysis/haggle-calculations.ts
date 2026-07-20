import type { CategoryIntelligence } from "@/lib/types/category-intelligence";
import type {
  AskingPriceRating,
  HaggleGuide,
  HaggleScripts,
} from "@/lib/types/haggle";
import { ASKING_RATING_LABELS } from "@/lib/types/haggle";
import type { DealAnalysis, DealCategory, DealCondition, DealInput } from "@/lib/types/deal";

const CATEGORY_FEE_RATE: Record<DealCategory, number> = {
  Electronics: 0.13,
  Furniture: 0.1,
  "Vehicles & Parts": 0.08,
  "Clothing & Accessories": 0.15,
  "Collectibles & Antiques": 0.12,
  "Tools & Hardware": 0.11,
  "Home & Garden": 0.1,
  "Sports & Outdoors": 0.12,
  "Toys & Games": 0.13,
  "Books & Media": 0.14,
  Appliances: 0.11,
  Other: 0.12,
};

const CONDITION_REPAIR_RATE: Record<DealCondition, number> = {
  New: 0.01,
  "Like New": 0.03,
  Good: 0.06,
  Fair: 0.12,
  Poor: 0.2,
};

const RATING_DESCRIPTIONS: Record<AskingPriceRating, string> = {
  great: "Strong margin at the asking price",
  good: "Solid flip room — light haggling may help",
  tight: "Thin margin — negotiate hard",
  overpriced: "Below target ROI — pass or lowball",
};

function roundPrice(value: number): number {
  if (value <= 0) return 0;
  if (value < 50) return Math.round(value);
  if (value < 200) return Math.round(value / 5) * 5;
  return Math.round(value / 10) * 10;
}

export function calculateFeesRepairsBuffer(
  resaleValue: number,
  category: DealCategory,
  condition: DealCondition
): number {
  if (resaleValue <= 0) return 0;
  const feeRate = CATEGORY_FEE_RATE[category];
  const repairRate = CONDITION_REPAIR_RATE[condition];
  return roundPrice(resaleValue * (feeRate + repairRate));
}

export function maxBuyPriceForRoi(
  netResaleValue: number,
  roiPercent: number
): number {
  if (netResaleValue <= 0) return 0;
  return roundPrice(netResaleValue / (1 + roiPercent / 100));
}

export function rateAskingPrice(
  askingPrice: number,
  maxBuy100: number,
  maxBuy50: number,
  maxBuy25: number
): AskingPriceRating {
  if (askingPrice <= 0) return "great";
  if (askingPrice <= maxBuy100) return "great";
  if (askingPrice <= maxBuy50) return "good";
  if (askingPrice <= maxBuy25) return "tight";
  return "overpriced";
}

function formatOffer(amount: number): string {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

function buildScripts(
  itemName: string,
  openingOffer: number,
  counterLow: number,
  counterHigh: number,
  walkAway: number
): HaggleScripts {
  const item = itemName.trim() || "this item";

  return {
    openingOffer: `Hi! I'm interested in the ${item}. Would you take ${formatOffer(openingOffer)} cash today? I can pick up quickly.`,
    counteroffer: `Thanks for getting back to me. Based on condition and what similar items sell for, I could do ${formatOffer(counterLow)}–${formatOffer(counterHigh)}. Let me know if that works.`,
    walkAway: `Appreciate your time — ${formatOffer(walkAway)} is the top of my budget. I'll pass for now, but message me if you're flexible on price.`,
  };
}

export function calculateHaggleGuide(
  input: DealInput,
  analysis: DealAnalysis,
  effectiveResaleValue: number,
  categoryIntel?: CategoryIntelligence
): HaggleGuide {
  const feesRepairsBuffer = calculateFeesRepairsBuffer(
    effectiveResaleValue,
    input.category,
    input.condition
  );
  const netResaleValue = Math.max(0, effectiveResaleValue - feesRepairsBuffer);
  const breakEvenBuyPrice = netResaleValue;

  const maxBuyPrice25Roi = maxBuyPriceForRoi(netResaleValue, 25);
  const maxBuyPrice50Roi = maxBuyPriceForRoi(netResaleValue, 50);
  const maxBuyPrice100Roi = maxBuyPriceForRoi(netResaleValue, 100);

  const suggestedOpeningOffer = roundPrice(
    Math.min(input.askingPrice * 0.82, maxBuyPrice50Roi * 0.86)
  );

  const counterofferLow = suggestedOpeningOffer;
  const counterofferHigh = roundPrice(
    Math.min(maxBuyPrice25Roi * 0.97, maxBuyPrice50Roi)
  );
  const walkAwayPrice = maxBuyPrice25Roi;

  const askingPriceRating = rateAskingPrice(
    input.askingPrice,
    maxBuyPrice100Roi,
    maxBuyPrice50Roi,
    maxBuyPrice25Roi
  );

  const scripts = buildScripts(
    input.itemName,
    suggestedOpeningOffer,
    counterofferLow,
    counterofferHigh,
    walkAwayPrice
  );

  return {
    effectiveResaleValue,
    feesRepairsBuffer,
    netResaleValue,
    breakEvenBuyPrice,
    maxBuyPrice25Roi,
    maxBuyPrice50Roi,
    maxBuyPrice100Roi,
    suggestedOpeningOffer,
    counterofferLow,
    counterofferHigh,
    walkAwayPrice,
    askingPriceRating,
    askingPriceRatingLabel: `${ASKING_RATING_LABELS[askingPriceRating]} — ${RATING_DESCRIPTIONS[askingPriceRating]}`,
    currentRoiPercent: analysis.roiPercent,
    scripts,
    negotiationNotes: categoryIntel?.negotiationLeverageNotes ?? [],
  };
}
