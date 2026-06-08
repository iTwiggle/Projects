import { normalizeListingUrl } from "@/lib/intake/listing-url";
import type { ComparableSale } from "@/lib/types/comps";

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

export type ResaleSource = "manual" | "estimated" | "comps";
export type EstimateConfidence = "low" | "medium" | "high";

export interface ResaleEstimate {
  low: number;
  midpoint: number;
  high: number;
  source: ResaleSource;
  confidence: EstimateConfidence;
}

export interface DealInput {
  itemName: string;
  category: DealCategory;
  askingPrice: number;
  condition: DealCondition;
  /** User-entered resale value. Null = use goblin quick estimate. */
  knownResaleValue: number | null;
  /** Optional source listing URL (stored when valid). */
  listingUrl: string | null;
  notes: string;
}

export interface ResolvedDeal {
  input: DealInput;
  resaleEstimate: ResaleEstimate;
  effectiveResaleValue: number;
}

export interface DealAnalysis {
  potentialProfit: number;
  roiPercent: number;
  riskScore: number;
  flipScore: number;
  timeToSellDays: number;
  timeToSellLabel: string;
  resaleEstimate: ResaleEstimate;
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
  comps: ComparableSale[];
  useCompsForResale: boolean;
}

export interface DashboardBestDeal {
  itemName: string;
  potentialProfit: number;
}

export interface DashboardStats {
  totalDeals: number;
  totalPotentialProfit: number;
  averageRoi: number;
  bestDeal: DashboardBestDeal | null;
}

export const EMPTY_DEAL_INPUT: DealInput = {
  itemName: "",
  category: "Electronics",
  askingPrice: 0,
  condition: "Good",
  knownResaleValue: null,
  listingUrl: null,
  notes: "",
};

/** @deprecated Legacy field — use normalizeDealInput() when loading. */
export interface LegacyDealFields {
  estimatedResaleValue?: number;
}

export function hasManualResaleValue(input: DealInput): boolean {
  return input.knownResaleValue !== null;
}

function normalizeListingUrlField(
  raw: DealInput & LegacyDealFields & { listingUrl?: string | null }
): string | null {
  if (raw.listingUrl === undefined || raw.listingUrl === null) {
    return null;
  }
  return normalizeListingUrl(raw.listingUrl);
}

export function normalizeDealInput(
  raw: DealInput & LegacyDealFields
): DealInput {
  const listingUrl = normalizeListingUrlField(raw);

  if ("knownResaleValue" in raw && raw.knownResaleValue !== undefined) {
    const { estimatedResaleValue: _legacy, ...rest } = raw;
    void _legacy;
    return { ...(rest as DealInput), listingUrl };
  }

  const legacy = raw.estimatedResaleValue;
  const { estimatedResaleValue: _legacy, ...rest } = raw;
  void _legacy;

  return {
    ...(rest as Omit<DealInput, "knownResaleValue" | "listingUrl">),
    knownResaleValue:
      typeof legacy === "number" && legacy > 0 ? legacy : null,
    listingUrl,
  };
}
