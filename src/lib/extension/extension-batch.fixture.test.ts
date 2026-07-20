import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeCapturedComps } from "@/lib/intake/comp-capture-import";
import type { CompCaptureBatch } from "@/lib/types/comp-capture";

const fixturePath = join(
  process.cwd(),
  "extension/fixtures/sample-ebay-batch.json"
);

describe("extension CompCaptureBatch fixture", () => {
  it("imports extension sample batch through Phase 1 contract", () => {
    const batch = JSON.parse(
      readFileSync(fixturePath, "utf8")
    ) as CompCaptureBatch;

    const { comps, report } = normalizeCapturedComps(batch);

    expect(batch.source).toBe("extension");
    expect(comps).toHaveLength(2);
    expect(report.importedCount).toBe(2);
    expect(comps[0].platform).toBe("eBay");
    expect(comps[0].listingType).toBe("sold");
    expect(comps[0].notes).toContain("https://www.ebay.com/itm/");
  });
});
