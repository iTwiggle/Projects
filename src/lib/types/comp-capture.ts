import type { FieldConfidence } from "@/lib/intake/listing-parser";
import type { CompListingType } from "@/lib/types/comps";
import type { DealCondition } from "@/lib/types/deal";

export const COMP_CAPTURE_SCHEMA_VERSION = "1.0";

export type CompCaptureSource =
  | "extension"
  | "paste"
  | "html"
  | "serpapi"
  | "manual"
  | "json";

export type CapturedCompConfidence = {
  title?: FieldConfidence;
  price?: FieldConfidence;
  listingType?: FieldConfidence;
  platform?: FieldConfidence;
  condition?: FieldConfidence;
};

export interface CapturedComp {
  title: string;
  price: number;
  platform: string;
  listingType: CompListingType;
  condition?: DealCondition | string;
  url?: string;
  imageUrl?: string;
  capturedAt?: string;
  rawText?: string;
  confidence?: CapturedCompConfidence;
}

export interface CompCaptureBatch {
  schemaVersion: string;
  source: CompCaptureSource;
  platform?: string;
  searchQuery?: string;
  capturedAt?: string;
  pageUrl?: string;
  comps: CapturedComp[];
}

export interface CompImportReport {
  importedCount: number;
  skippedCount: number;
  duplicateCount: number;
  warnings: string[];
}

export interface NormalizeCapturedCompsResult {
  comps: import("@/lib/types/comps").ComparableSale[];
  report: CompImportReport;
}
