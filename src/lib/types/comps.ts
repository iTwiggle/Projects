import type { DealCondition, EstimateConfidence } from "@/lib/types/deal";

export const COMP_PLATFORMS = [
  "eBay",
  "Facebook Marketplace",
  "Mercari",
  "OfferUp",
  "Craigslist",
  "Poshmark",
  "Grailed",
  "Other",
] as const;

export type CompPlatform = (typeof COMP_PLATFORMS)[number];
export type CompListingType = "sold" | "listed";

export interface ComparableSale {
  id: string;
  title: string;
  platform: string;
  price: number;
  condition: DealCondition;
  notes: string;
  listingType: CompListingType;
}

export interface CompSummary {
  count: number;
  average: number;
  median: number;
  low: number;
  high: number;
  confidence: EstimateConfidence;
  soldCount: number;
  listedCount: number;
}

export interface AnalysisOptions {
  comps?: ComparableSale[];
  useCompsForResale?: boolean;
}

export const MIN_COMPS_FOR_ESTIMATE = 3;

export const EMPTY_COMP: Omit<ComparableSale, "id"> = {
  title: "",
  platform: "eBay",
  price: 0,
  condition: "Good",
  notes: "",
  listingType: "sold",
};

export function generateCompId(): string {
  return `comp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
