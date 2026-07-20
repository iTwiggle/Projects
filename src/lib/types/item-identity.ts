export type IdentityConfidence = "high" | "medium" | "low";

export type IdentityEvidenceSource =
  | "ocr"
  | "listingText"
  | "itemName"
  | "notes"
  | "comparableSales"
  | "url";

export type IdentityEvidence = {
  matchedSources: IdentityEvidenceSource[];
  matchCount: number;
  conflictCount: number;
};

export interface ItemIdentity {
  brand: string | null;
  model: string | null;
  productFamily: string | null;
  variant: string | null;
  confidence: IdentityConfidence;
  /** Human-readable summary for UI and reasoning. */
  displayLabel: string;
  /** User-facing labels for evidence sources (e.g. "Item Name", "OCR"). */
  sources: string[];
  evidence: IdentityEvidence;
  hasConflict: boolean;
  warnings: string[];
}

export type ItemIdentitySources = {
  listingText?: string;
  /** Raw OCR text — cleaned before identity detection. */
  ocrText?: string;
  /** Decoded hints from listing URL path or query. */
  urlText?: string;
};

export const IDENTITY_CONFLICT_WARNING =
  "Conflicting identity signals detected";

export const EMPTY_ITEM_IDENTITY: ItemIdentity = {
  brand: null,
  model: null,
  productFamily: null,
  variant: null,
  confidence: "low",
  displayLabel: "Unknown product",
  sources: [],
  evidence: {
    matchedSources: [],
    matchCount: 0,
    conflictCount: 0,
  },
  hasConflict: false,
  warnings: [],
};
