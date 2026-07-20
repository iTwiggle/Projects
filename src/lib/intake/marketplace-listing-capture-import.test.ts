import { describe, expect, it } from "vitest";
import {
  marketplaceListingBatchToExtractedFields,
  normalizeMarketplaceListingCapture,
  parseMarketplaceListingCaptureJson,
} from "@/lib/intake/marketplace-listing-capture-import";
import { MARKETPLACE_LISTING_CAPTURE_SCHEMA_VERSION } from "@/lib/types/marketplace-listing-capture";
import type { MarketplaceListingCaptureBatch } from "@/lib/types/marketplace-listing-capture";

function makeBatch(
  listing: MarketplaceListingCaptureBatch["listing"],
  overrides: Partial<MarketplaceListingCaptureBatch> = {}
): MarketplaceListingCaptureBatch {
  return {
    schemaVersion: MARKETPLACE_LISTING_CAPTURE_SCHEMA_VERSION,
    source: "extension",
    platform: "Facebook Marketplace",
    capturedAt: "2026-06-08T12:00:00.000Z",
    pageUrl: listing.listingUrl,
    listing,
    ...overrides,
  };
}

describe("marketplace-listing-capture-import", () => {
  it("imports a structured Facebook listing capture", () => {
    const batch = makeBatch({
      title: "Milwaukee M18 Drill",
      askingPrice: 89.99,
      description: "Includes battery and charger.",
      listingUrl: "https://www.facebook.com/marketplace/item/123",
      rawText: "Milwaukee M18 Drill $89.99 Includes battery and charger.",
      capturedAt: "2026-06-08T12:00:00.000Z",
      confidence: {
        title: "high",
        askingPrice: "high",
        description: "medium",
        listingUrl: "high",
      },
    });

    const { fields, confidence } = marketplaceListingBatchToExtractedFields(batch);

    expect(fields.itemName).toBe("Milwaukee M18 Drill");
    expect(fields.askingPrice).toBe(89.99);
    expect(fields.notes).toContain("Includes battery");
    expect(confidence.itemName).toBe("high");
    expect(confidence.askingPrice).toBe("high");
  });

  it("falls back to visible text parsing when selectors fail", () => {
    const batch = makeBatch(
      {
        listingUrl: "https://www.facebook.com/marketplace/item/456",
        rawText:
          "DeWalt 20V Drill Kit\n$55 OBO\nGood condition\nPickup only downtown.",
        capturedAt: "2026-06-08T12:00:00.000Z",
        confidence: {
          title: "low",
          askingPrice: "low",
          listingUrl: "high",
        },
      },
      { selectorFallback: true }
    );

    const { fields, warnings } = marketplaceListingBatchToExtractedFields(batch);

    expect(fields.itemName.length).toBeGreaterThan(0);
    expect(fields.askingPrice).toBeGreaterThan(0);
    expect(warnings.some((warning) => /fallback capture/i.test(warning))).toBe(
      true
    );
  });

  it("rejects invalid listing capture JSON", () => {
    expect(parseMarketplaceListingCaptureJson("").error).toMatch(/empty/i);
    expect(
      parseMarketplaceListingCaptureJson(
        JSON.stringify({
          schemaVersion: "9.9",
          source: "extension",
          listing: { listingUrl: "x", rawText: "y" },
        })
      ).error
    ).toMatch(/schemaVersion/i);
    expect(
      parseMarketplaceListingCaptureJson(
        JSON.stringify({
          schemaVersion: MARKETPLACE_LISTING_CAPTURE_SCHEMA_VERSION,
          source: "extension",
          listing: { listingUrl: "not-a-url", rawText: "text" },
        })
      ).error
    ).toMatch(/url/i);
  });

  it("builds import report warnings", () => {
    const result = normalizeMarketplaceListingCapture(
      makeBatch(
        {
          listingUrl: "https://www.facebook.com/marketplace/item/789",
          rawText: "Some visible page text without structured fields.",
          capturedAt: "2026-06-08T12:00:00.000Z",
          confidence: { listingUrl: "high" },
        },
        { selectorFallback: true }
      )
    );

    expect(result.report.usedSelectorFallback).toBe(true);
    expect(result.report.warnings.length).toBeGreaterThan(0);
  });
});
