import { describe, expect, it } from "vitest";
import {
  compDedupeKey,
  getCompTitleMismatchWarnings,
  normalizeCapturedComps,
  normalizeCapturedPlatform,
  parseCompCaptureJson,
  tryParseCompCaptureBatch,
} from "@/lib/intake/comp-capture-import";
import type { CompCaptureBatch } from "@/lib/types/comp-capture";
import { COMP_CAPTURE_SCHEMA_VERSION } from "@/lib/types/comp-capture";
import type { ComparableSale } from "@/lib/types/comps";
import { EMPTY_ITEM_IDENTITY } from "@/lib/types/item-identity";
import { parseCompTextBatch } from "@/lib/intake/comp-text-parser";

function makeBatch(
  comps: CompCaptureBatch["comps"],
  overrides: Partial<CompCaptureBatch> = {}
): CompCaptureBatch {
  return {
    schemaVersion: COMP_CAPTURE_SCHEMA_VERSION,
    source: "json",
    platform: "eBay",
    searchQuery: "Milwaukee M18 Fuel",
    comps,
    ...overrides,
  };
}

function makeExistingComp(
  title: string,
  price: number,
  platform = "eBay"
): ComparableSale {
  return {
    id: "existing-1",
    title,
    price,
    platform,
    condition: "Good",
    notes: "",
    listingType: "sold",
  };
}

describe("normalizeCapturedComps", () => {
  it("imports a valid batch", () => {
    const { comps, report } = normalizeCapturedComps(
      makeBatch([
        {
          title: "Milwaukee M18 Fuel Drill",
          price: 89.99,
          platform: "eBay",
          listingType: "sold",
          condition: "Good",
          url: "https://www.ebay.com/itm/123",
        },
      ])
    );

    expect(comps).toHaveLength(1);
    expect(comps[0].title).toBe("Milwaukee M18 Fuel Drill");
    expect(comps[0].price).toBe(89.99);
    expect(comps[0].notes).toContain("https://www.ebay.com/itm/123");
    expect(report.importedCount).toBe(1);
    expect(report.skippedCount).toBe(0);
    expect(report.duplicateCount).toBe(0);
  });

  it("skips invalid fields and reports warnings", () => {
    const { comps, report } = normalizeCapturedComps(
      makeBatch([
        {
          title: "",
          price: 0,
          platform: "eBay",
          listingType: "sold",
        },
        {
          title: "Valid comp",
          price: 50,
          platform: "eBay",
          listingType: "sold",
        },
      ])
    );

    expect(comps).toHaveLength(1);
    expect(report.importedCount).toBe(1);
    expect(report.skippedCount).toBe(1);
    expect(report.warnings.some((w) => w.includes("invalid title"))).toBe(true);
  });

  it("dedupes against existing comps and within batch", () => {
    const existing = makeExistingComp("Milwaukee M18 Fuel Drill", 89.99);
    const { comps, report } = normalizeCapturedComps(
      makeBatch([
        {
          title: "Milwaukee M18 Fuel Drill",
          price: 89.99,
          platform: "eBay",
          listingType: "sold",
        },
        {
          title: "Milwaukee M18 Fuel Drill",
          price: 89.99,
          platform: "eBay",
          listingType: "sold",
        },
        {
          title: "DeWalt XR Drill",
          price: 70,
          platform: "eBay",
          listingType: "sold",
        },
      ]),
      { existingComps: [existing] }
    );

    expect(comps).toHaveLength(1);
    expect(comps[0].title).toBe("DeWalt XR Drill");
    expect(report.duplicateCount).toBe(2);
  });

  it("normalizes platform aliases", () => {
    const { comps } = normalizeCapturedComps(
      makeBatch([
        {
          title: "Local dresser",
          price: 120,
          platform: "facebook",
          listingType: "listed",
        },
      ])
    );

    expect(comps[0].platform).toBe("Facebook Marketplace");
  });

  it("warns when comp title disagrees with identity and search query", () => {
    const { report } = normalizeCapturedComps(
      makeBatch([
        {
          title: "Apple iPhone 13 Pro",
          price: 400,
          platform: "eBay",
          listingType: "sold",
        },
      ]),
      {
        itemIdentity: {
          ...EMPTY_ITEM_IDENTITY,
          brand: "Milwaukee",
          confidence: "high",
        },
        compSearchQuery: "Milwaukee M18 Fuel",
      }
    );

    expect(report.importedCount).toBe(1);
    expect(report.warnings.some((w) => w.includes("Milwaukee"))).toBe(true);
    expect(report.warnings.some((w) => w.includes("search query"))).toBe(true);
  });
});

describe("normalizeCapturedPlatform", () => {
  it("maps known aliases", () => {
    expect(normalizeCapturedPlatform("ebay")).toBe("eBay");
    expect(normalizeCapturedPlatform("offerup")).toBe("OfferUp");
    expect(normalizeCapturedPlatform("unknown-site")).toBe("Other");
  });
});

describe("parseCompCaptureJson", () => {
  it("parses valid JSON envelope", () => {
    const json = JSON.stringify(
      makeBatch([
        {
          title: "Test item",
          price: 25,
          platform: "eBay",
          listingType: "sold",
        },
      ])
    );

    const result = parseCompCaptureJson(json);
    expect(result.error).toBeNull();
    expect(result.batch?.comps).toHaveLength(1);
  });

  it("rejects unsupported schema version", () => {
    const json = JSON.stringify({
      schemaVersion: "9.9",
      source: "json",
      comps: [],
    });

    const result = parseCompCaptureJson(json);
    expect(result.batch).toBeNull();
    expect(result.error).toContain("Unsupported schemaVersion");
  });
});

describe("tryParseCompCaptureBatch", () => {
  it("detects JSON envelopes", () => {
    const json = JSON.stringify(
      makeBatch([
        {
          title: "Test",
          price: 10,
          platform: "eBay",
          listingType: "sold",
        },
      ])
    );

    expect(tryParseCompCaptureBatch(json)?.comps).toHaveLength(1);
    expect(tryParseCompCaptureBatch("plain text comp\n$40")).toBeNull();
  });
});

describe("getCompTitleMismatchWarnings", () => {
  it("returns empty when title aligns with identity", () => {
    const warnings = getCompTitleMismatchWarnings("Milwaukee M18 drill", {
      itemIdentity: {
        ...EMPTY_ITEM_IDENTITY,
        brand: "Milwaukee",
        confidence: "high",
      },
      compSearchQuery: "Milwaukee M18",
    });

    expect(warnings).toHaveLength(0);
  });
});

describe("compDedupeKey", () => {
  it("is stable for equivalent comps", () => {
    const a = compDedupeKey({
      platform: "eBay",
      title: " Milwaukee Drill ",
      price: 50,
    });
    const b = compDedupeKey({
      platform: "ebay",
      title: "milwaukee drill",
      price: 50,
    });
    expect(a).toBe(b);
  });
});

describe("plain text paste compatibility", () => {
  it("still parses non-JSON comp text batches", () => {
    const drafts = parseCompTextBatch(`Makita drill
Sold on eBay
$45`);

    expect(drafts.length).toBeGreaterThan(0);
    expect(tryParseCompCaptureBatch(`Makita drill\nSold on eBay\n$45`)).toBeNull();
  });
});
