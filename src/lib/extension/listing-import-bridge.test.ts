import { describe, expect, it } from "vitest";
import {
  EXTENSION_LISTING_IMPORT_MESSAGE_TYPE,
  createExtensionListingImportAck,
  isExtensionListingImportMessage,
  isTrustedExtensionListingImportOrigin,
  validateExtensionListingImportMessage,
} from "@/lib/extension/listing-import-bridge";
import { MARKETPLACE_LISTING_CAPTURE_SCHEMA_VERSION } from "@/lib/types/marketplace-listing-capture";

function makeListingMessage(overrides: Record<string, unknown> = {}) {
  return {
    type: EXTENSION_LISTING_IMPORT_MESSAGE_TYPE,
    payload: {
      schemaVersion: MARKETPLACE_LISTING_CAPTURE_SCHEMA_VERSION,
      source: "extension",
      platform: "Facebook Marketplace",
      capturedAt: "2026-06-08T12:00:00.000Z",
      pageUrl: "https://www.facebook.com/marketplace/item/123",
      listing: {
        title: "Milwaukee Drill",
        askingPrice: 45,
        listingUrl: "https://www.facebook.com/marketplace/item/123",
        rawText: "Milwaukee Drill $45 Good condition",
        capturedAt: "2026-06-08T12:00:00.000Z",
        confidence: { title: "high", askingPrice: "high", listingUrl: "high" },
      },
      ...overrides,
    },
  };
}

describe("listing-import-bridge", () => {
  it("accepts a valid listing import message", () => {
    const message = makeListingMessage();
    const result = validateExtensionListingImportMessage(message);

    expect(result.error).toBeNull();
    expect(result.batch?.listing.title).toBe("Milwaukee Drill");
    expect(isExtensionListingImportMessage(message)).toBe(true);
  });

  it("rejects malformed and oversized payloads", () => {
    expect(validateExtensionListingImportMessage(null).error).toMatch(
      /malformed/i
    );
    expect(
      validateExtensionListingImportMessage({
        type: EXTENSION_LISTING_IMPORT_MESSAGE_TYPE,
        payload: {
          schemaVersion: MARKETPLACE_LISTING_CAPTURE_SCHEMA_VERSION,
          source: "extension",
          listing: {
            listingUrl: "https://www.facebook.com/marketplace/item/1",
            rawText: "",
          },
        },
      }).error
    ).toMatch(/visible text/i);

    const huge = "x".repeat(120_000);
    const message = makeListingMessage({
      listing: {
        title: huge,
        askingPrice: 10,
        listingUrl: "https://www.facebook.com/marketplace/item/123",
        rawText: huge,
        capturedAt: "2026-06-08T12:00:00.000Z",
        confidence: {},
      },
    });
    expect(validateExtensionListingImportMessage(message).error).toMatch(
      /exceeds maximum/i
    );
  });

  it("restricts accepted origins", () => {
    expect(
      isTrustedExtensionListingImportOrigin(
        "http://localhost:3000",
        "http://localhost:3000"
      )
    ).toBe(true);
    expect(
      isTrustedExtensionListingImportOrigin(
        "http://evil.example",
        "http://localhost:3000"
      )
    ).toBe(false);
  });

  it("creates listing import ack messages", () => {
    const ack = createExtensionListingImportAck(false, "Not listening");
    expect(ack.ok).toBe(false);
    expect(ack.error).toBe("Not listening");
  });
});
