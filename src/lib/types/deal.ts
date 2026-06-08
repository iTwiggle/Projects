export const DEAL_CATEGORIES = [
  "Electronics",
  "Furniture",
  "Vehicles & Parts",
  "Clothing & Accessories",
  "Collectibles & Antiques",
  "Tools & Hardware",
  "Home & Garden",
  "Sports & Outdoors",
  "Toys & Games",
  "Books & Media",
  "Appliances",
  "Other",
] as const;

export const DEAL_CONDITIONS = [
  "New",
  "Like New",
  "Good",
  "Fair",
  "Poor",
] as const;

export type DealCategory = (typeof DEAL_CATEGORIES)[number];
export type DealCondition = (typeof DEAL_CONDITIONS)[number];

export type VerdictType = "approved" | "caution" | "reject";

export interface DealInput {
  itemName: string;
  category: DealCategory;
  askingPrice: number;
  condition: DealCondition;
  estimatedResaleValue: number;
  notes: string;
}

export interface DealAnalysis {
  potentialProfit: number;
  roiPercent: number;
  riskScore: number;
  flipScore: number;
  timeToSellDays: number;
  timeToSellLabel: string;
}

export interface GoblinVerdict {
  type: VerdictType;
  label: string;
  emoji: string;
  reasoning: string[];
}

export interface SavedDeal extends DealInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  analysis: DealAnalysis;
  verdict: GoblinVerdict;
}

export interface DashboardStats {
  totalDeals: number;
  totalPotentialProfit: number;
  averageRoi: number;
  bestDeal: SavedDeal | null;
}

export const EMPTY_DEAL_INPUT: DealInput = {
  itemName: "",
  category: "Electronics",
  askingPrice: 0,
  condition: "Good",
  estimatedResaleValue: 0,
  notes: "",
};
