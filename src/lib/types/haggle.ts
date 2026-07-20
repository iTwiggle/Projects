export type AskingPriceRating = "great" | "good" | "tight" | "overpriced";

export interface HaggleScripts {
  openingOffer: string;
  counteroffer: string;
  walkAway: string;
}

export interface HaggleGuide {
  effectiveResaleValue: number;
  feesRepairsBuffer: number;
  netResaleValue: number;
  breakEvenBuyPrice: number;
  maxBuyPrice25Roi: number;
  maxBuyPrice50Roi: number;
  maxBuyPrice100Roi: number;
  suggestedOpeningOffer: number;
  counterofferLow: number;
  counterofferHigh: number;
  walkAwayPrice: number;
  askingPriceRating: AskingPriceRating;
  askingPriceRatingLabel: string;
  currentRoiPercent: number;
  scripts: HaggleScripts;
  negotiationNotes: string[];
}

export const ASKING_RATING_LABELS: Record<AskingPriceRating, string> = {
  great: "Great",
  good: "Good",
  tight: "Tight",
  overpriced: "Overpriced",
};
