import {
  DEFAULT_EXTRACTED,
  type ExtractionConfidence,
  type ExtractedListingFields,
  type FieldConfidence,
  parseListingWithConfidence,
} from "@/lib/intake/listing-parser";
import {
  MARKETPLACE_LISTING_CAPTURE_SCHEMA_VERSION,
  type CapturedMarketplaceListing,
  type MarketplaceListingCaptureBatch,
  type MarketplaceListingImportResult,
} from "@/lib/types/marketplace-listing-capture";

const MAX_RAW_TEXT_LENGTH = 8000;
const MAX_TITLE_LENGTH = 300;
const MAX_DESCRIPTION_LENGTH = 4000;
const MAX_URL_LENGTH = 2000;
const MAX_PRICE = 1_000_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function normalizeConfidence(value: unknown): FieldConfidence {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "low";
}

function normalizePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const rounded = Math.round(value * 100) / 100;
    if (rounded > 0 && rounded <= MAX_PRICE) return rounded;
    return null;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0 && parsed <= MAX_PRICE) {
      return Math.round(parsed * 100) / 100;
    }
  }
  return null;
}

function normalizeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

export function isMarketplaceListingCaptureBatch(
  value: unknown
): value is MarketplaceListingCaptureBatch {
  if (!isRecord(value)) return false;
  if (typeof value.schemaVersion !== "string") return false;
  if (value.source !== "extension") return false;
  if (!isRecord(value.listing)) return false;
  return (
    typeof value.listing.listingUrl === "string" &&
    typeof value.listing.rawText === "string"
  );
}

export function parseMarketplaceListingCaptureJson(
  text: string
): { batch: MarketplaceListingCaptureBatch | null; error: string | null } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { batch: null, error: "JSON input is empty." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { batch: null, error: "Invalid JSON." };
  }

  if (!isMarketplaceListingCaptureBatch(parsed)) {
    return {
      batch: null,
      error:
        "JSON must be a MarketplaceListingCaptureBatch with schemaVersion, source, and listing.",
    };
  }

  if (parsed.schemaVersion !== MARKETPLACE_LISTING_CAPTURE_SCHEMA_VERSION) {
    return {
      batch: null,
      error: `Unsupported schemaVersion "${parsed.schemaVersion}". Expected ${MARKETPLACE_LISTING_CAPTURE_SCHEMA_VERSION}.`,
    };
  }

  const listingUrl = normalizeUrl(parsed.listing.listingUrl);
  if (!listingUrl) {
    return { batch: null, error: "Listing URL is missing or invalid." };
  }

  const rawText = normalizeWhitespace(parsed.listing.rawText || "");
  if (!rawText) {
    return { batch: null, error: "Listing capture has no visible text." };
  }

  return { batch: parsed, error: null };
}

function confidenceFromCapture(
  listing: CapturedMarketplaceListing
): ExtractionConfidence {
  const captureConfidence = listing.confidence ?? {};
  return {
    itemName: normalizeConfidence(captureConfidence.title),
    askingPrice: normalizeConfidence(captureConfidence.askingPrice),
    condition: "low",
    category: "low",
  };
}

export function marketplaceListingBatchToExtractedFields(
  batch: MarketplaceListingCaptureBatch
): {
  fields: ExtractedListingFields;
  confidence: ExtractionConfidence;
  warnings: string[];
} {
  const warnings: string[] = [];
  const listing = batch.listing;
  const captureConfidence = confidenceFromCapture(listing);

  if (batch.selectorFallback) {
    warnings.push(
      "Extension used fallback capture (visible page text + URL only). Review all fields carefully."
    );
  }

  const structuredTitle = listing.title
    ? normalizeWhitespace(listing.title).slice(0, MAX_TITLE_LENGTH)
    : "";
  const structuredPrice = normalizePrice(listing.askingPrice);
  const structuredDescription = listing.description
    ? normalizeWhitespace(listing.description).slice(0, MAX_DESCRIPTION_LENGTH)
    : "";

  if (structuredTitle || structuredPrice !== null) {
    const notesParts = [structuredDescription];
    if (listing.imageUrl) {
      notesParts.push(`Image: ${listing.imageUrl}`);
    }
    const notes = notesParts.filter(Boolean).join("\n\n");

    return {
      fields: {
        itemName: structuredTitle,
        askingPrice: structuredPrice ?? 0,
        condition: DEFAULT_EXTRACTED.condition,
        category: DEFAULT_EXTRACTED.category,
        notes,
      },
      confidence: {
        itemName: structuredTitle
          ? captureConfidence.itemName
          : "low",
        askingPrice:
          structuredPrice !== null ? captureConfidence.askingPrice : "low",
        condition: "low",
        category: "low",
      },
      warnings,
    };
  }

  const parsed = parseListingWithConfidence(
    listing.rawText.slice(0, MAX_RAW_TEXT_LENGTH)
  );
  warnings.push("Structured selectors were weak — Goblin parsed visible text.");

  if (structuredDescription && !parsed.fields.notes) {
    parsed.fields.notes = structuredDescription;
  }

  return {
    fields: parsed.fields,
    confidence: parsed.confidence,
    warnings,
  };
}

export function normalizeMarketplaceListingCapture(
  batch: MarketplaceListingCaptureBatch
): MarketplaceListingImportResult {
  const { fields, confidence, warnings } =
    marketplaceListingBatchToExtractedFields(batch);

  if (!fields.itemName && !fields.askingPrice && !fields.notes) {
    warnings.push("No usable listing fields were extracted.");
  }

  if (confidence.askingPrice === "low" && fields.askingPrice <= 0) {
    warnings.push("Asking price was not detected — enter it manually.");
  }

  return {
    batch,
    report: {
      warnings,
      usedSelectorFallback: Boolean(batch.selectorFallback),
    },
  };
}

export function marketplaceListingBatchToDealPartial(
  batch: MarketplaceListingCaptureBatch
): {
  proposed: Partial<import("@/lib/types/deal").DealInput>;
  fields: ExtractedListingFields;
  confidence: ExtractionConfidence;
  report: MarketplaceListingImportResult["report"];
} {
  const normalized = normalizeMarketplaceListingCapture(batch);
  const { fields, confidence } = marketplaceListingBatchToExtractedFields(batch);

  return {
    proposed: {
      itemName: fields.itemName,
      askingPrice: fields.askingPrice,
      condition: fields.condition,
      category: fields.category,
      notes: fields.notes,
      listingUrl: batch.listing.listingUrl,
      knownResaleValue: null,
    },
    fields,
    confidence,
    report: normalized.report,
  };
}
