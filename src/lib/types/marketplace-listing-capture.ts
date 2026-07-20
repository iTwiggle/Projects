import type { FieldConfidence } from "@/lib/intake/listing-parser";

export const MARKETPLACE_LISTING_CAPTURE_SCHEMA_VERSION = "1.0" as const;

export type MarketplaceListingCaptureSource = "extension";

export interface MarketplaceListingCaptureConfidence {
  title?: FieldConfidence;
  askingPrice?: FieldConfidence;
  description?: FieldConfidence;
  imageUrl?: FieldConfidence;
  listingUrl?: FieldConfidence;
}

export interface CapturedMarketplaceListing {
  title?: string;
  askingPrice?: number | null;
  description?: string;
  imageUrl?: string;
  listingUrl: string;
  rawText: string;
  capturedAt: string;
  confidence: MarketplaceListingCaptureConfidence;
}

export interface MarketplaceListingCaptureBatch {
  schemaVersion: typeof MARKETPLACE_LISTING_CAPTURE_SCHEMA_VERSION;
  source: MarketplaceListingCaptureSource;
  platform: string;
  capturedAt: string;
  pageUrl: string;
  listing: CapturedMarketplaceListing;
  /** True when DOM selectors failed and only URL + visible text were captured. */
  selectorFallback?: boolean;
}

export interface MarketplaceListingImportReport {
  warnings: string[];
  usedSelectorFallback: boolean;
}

export interface MarketplaceListingImportResult {
  batch: MarketplaceListingCaptureBatch;
  report: MarketplaceListingImportReport;
}
