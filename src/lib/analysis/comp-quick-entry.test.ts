import { describe, expect, it } from "vitest";
import { buildQuickComp, isValidQuickComp } from "@/lib/analysis/comp-quick-entry";

describe("buildQuickComp", () => {
  it("builds a comp with smart defaults", () => {
    const comp = buildQuickComp("Makita drill sold", 85, "sold", {
      platform: "eBay",
      condition: "Good",
    });

    expect(comp.title).toBe("Makita drill sold");
    expect(comp.price).toBe(85);
    expect(comp.listingType).toBe("sold");
    expect(comp.platform).toBe("eBay");
    expect(comp.condition).toBe("Good");
    expect(comp.notes).toBe("");
  });
});

describe("isValidQuickComp", () => {
  it("requires title and positive price", () => {
    expect(isValidQuickComp("Item", 50)).toBe(true);
    expect(isValidQuickComp("", 50)).toBe(false);
    expect(isValidQuickComp("Item", 0)).toBe(false);
  });
});
