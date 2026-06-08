import type { DealCategory } from "@/lib/types/deal";

export type IntelligenceCategory =
  | "Electronics"
  | "Tools & Hardware"
  | "Vehicles"
  | "Furniture"
  | "Appliances"
  | "Collectibles"
  | "Clothing"
  | "Other";

export type CategorySignalType = "risk" | "booster" | "penalty";

export interface CategorySignal {
  id: string;
  label: string;
  type: CategorySignalType;
  message: string;
}

export type ConfidenceAdjustment = "none" | "downgrade_one" | "downgrade_to_low";

export interface CategoryIntelligence {
  intelligenceCategory: IntelligenceCategory;
  dealCategory: DealCategory;
  matchedRisks: CategorySignal[];
  matchedBoosters: CategorySignal[];
  matchedPenalties: CategorySignal[];
  inspectionChecklist: string[];
  resaleSpeedNotes: string[];
  negotiationLeverageNotes: string[];
  advice: string[];
  warnings: string[];
  riskAdjustment: number;
  confidenceAdjustment: ConfidenceAdjustment;
}
