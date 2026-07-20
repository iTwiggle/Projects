import { describe, expect, it } from "vitest";
import {
  EXTENSION_IMPORT_ACK_MESSAGE_TYPE,
  EXTENSION_IMPORT_MESSAGE_TYPE,
  EXTENSION_IMPORT_LISTEN_TIMEOUT_MS,
  createExtensionImportAck,
  isExtensionImportAckMessage,
  isExtensionImportMessage,
  isTrustedExtensionImportOrigin,
  measureJsonUtf8Bytes,
  validateExtensionImportMessage,
} from "@/lib/extension/comp-import-bridge";
import { normalizeCapturedComps } from "@/lib/intake/comp-capture-import";
import { COMP_CAPTURE_SCHEMA_VERSION } from "@/lib/types/comp-capture";
import type { CompCaptureBatch } from "@/lib/types/comp-capture";
import type { ComparableSale } from "@/lib/types/comps";

function makeBatch(
  comps: CompCaptureBatch["comps"],
  overrides: Partial<CompCaptureBatch> = {}
): CompCaptureBatch {
  return {
    schemaVersion: COMP_CAPTURE_SCHEMA_VERSION,
    source: "extension",
    platform: "eBay",
    searchQuery: "Milwaukee M18",
    capturedAt: "2026-06-08T12:00:00.000Z",
    pageUrl: "https://www.ebay.com/sch/i.html",
    comps,
    ...overrides,
  };
}

function makeImportMessage(batch: CompCaptureBatch) {
  return {
    type: EXTENSION_IMPORT_MESSAGE_TYPE,
    payload: batch,
  };
}

describe("comp-import-bridge", () => {
  it("accepts a valid extension import message", () => {
    const batch = makeBatch([
      {
        title: "Milwaukee M18 Fuel Drill",
        price: 89.99,
        platform: "eBay",
        listingType: "sold",
      },
    ]);

    const result = validateExtensionImportMessage(makeImportMessage(batch));

    expect(result.error).toBeNull();
    expect(result.batch?.comps).toHaveLength(1);
    expect(isExtensionImportMessage(makeImportMessage(batch))).toBe(true);
  });

  it("rejects malformed and invalid payloads", () => {
    expect(validateExtensionImportMessage(null).error).toMatch(/malformed/i);
    expect(validateExtensionImportMessage({ type: "OTHER" }).error).toMatch(
      /malformed/i
    );
    expect(
      validateExtensionImportMessage({
        type: EXTENSION_IMPORT_MESSAGE_TYPE,
        payload: { schemaVersion: "9.9", source: "extension", comps: [] },
      }).error
    ).toMatch(/schemaVersion|no comps/i);
    expect(
      validateExtensionImportMessage({
        type: EXTENSION_IMPORT_MESSAGE_TYPE,
        payload: {
          schemaVersion: COMP_CAPTURE_SCHEMA_VERSION,
          source: "extension",
          comps: [],
        },
      }).error
    ).toMatch(/no comps/i);
  });

  it("rejects oversized payloads", () => {
    const hugeTitle = "x".repeat(50_000);
    const batch = makeBatch([
      {
        title: hugeTitle,
        price: 10,
        platform: "eBay",
        listingType: "sold",
        rawText: "y".repeat(50_000),
      },
    ]);

    const bytes = measureJsonUtf8Bytes(batch);
    const result = validateExtensionImportMessage(makeImportMessage(batch), bytes - 1);

    expect(result.batch).toBeNull();
    expect(result.error).toMatch(/exceeds maximum/i);
  });

  it("restricts accepted origins to same page origin", () => {
    expect(
      isTrustedExtensionImportOrigin(
        "http://localhost:3000",
        "http://localhost:3000"
      )
    ).toBe(true);
    expect(
      isTrustedExtensionImportOrigin(
        "http://evil.example",
        "http://localhost:3000"
      )
    ).toBe(false);
  });

  it("dedupes extension batches against existing comps", () => {
    const batch = makeBatch([
      {
        title: "Milwaukee M18 Fuel Drill",
        price: 89.99,
        platform: "eBay",
        listingType: "sold",
      },
      {
        title: "Milwaukee M18 Battery",
        price: 29.99,
        platform: "eBay",
        listingType: "sold",
      },
    ]);

    const validated = validateExtensionImportMessage(makeImportMessage(batch));
    expect(validated.batch).not.toBeNull();

    const existing: ComparableSale[] = [
      {
        id: "existing-1",
        title: "Milwaukee M18 Fuel Drill",
        price: 89.99,
        platform: "eBay",
        condition: "Good",
        notes: "",
        listingType: "sold",
      },
    ];

    const { comps, report } = normalizeCapturedComps(validated.batch!, {
      existingComps: existing,
    });

    expect(comps).toHaveLength(1);
    expect(comps[0].title).toBe("Milwaukee M18 Battery");
    expect(report.duplicateCount).toBe(1);
    expect(report.importedCount).toBe(1);
  });

  it("creates and recognizes ack messages", () => {
    const ack = createExtensionImportAck(true);
    expect(ack.type).toBe(EXTENSION_IMPORT_ACK_MESSAGE_TYPE);
    expect(isExtensionImportAckMessage(ack)).toBe(true);

    const fail = createExtensionImportAck(false, "Not listening");
    expect(fail.ok).toBe(false);
    expect(fail.error).toBe("Not listening");
  });

  it("exposes a two-minute inactivity listen timeout constant", () => {
    expect(EXTENSION_IMPORT_LISTEN_TIMEOUT_MS).toBe(120_000);
  });
});
