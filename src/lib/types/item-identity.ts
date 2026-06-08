export type IdentityConfidence = "high" | "medium" | "low";

export interface ItemIdentity {
  brand: string | null;
  model: string | null;
  productFamily: string | null;
  variant: string | null;
  confidence: IdentityConfidence;
  /** Human-readable summary for UI and reasoning. */
  displayLabel: string;
  /** Which text buckets contributed (e.g. itemName, notes, comps). */
  sources: string[];
}

export const EMPTY_ITEM_IDENTITY: ItemIdentity = {
  brand: null,
  model: null,
  productFamily: null,
  variant: null,
  confidence: "low",
  displayLabel: "Unknown product",
  sources: [],
};
