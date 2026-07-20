import { describe, expect, it } from "vitest";
import {
  getFacebookPageKind,
  normalizeFacebookListingUrl,
  normalizeVisibleText,
  parseFacebookPrice,
  selectorConfidence,
} from "../../../extension/lib/facebook-parser.js";

describe("extension facebook-parser", () => {
  it("parses Facebook listing prices", () => {
    expect(parseFacebookPrice("$45")).toBe(45);
    expect(parseFacebookPrice("US $1,234.50")).toBe(1234.5);
    expect(parseFacebookPrice("free")).toBeNull();
  });

  it("detects Facebook Marketplace listing pages", () => {
    expect(
      getFacebookPageKind(
        "https://www.facebook.com/marketplace/item/123456789/"
      )
    ).toBe("listing");
    expect(
      getFacebookPageKind("https://www.facebook.com/marketplace/")
    ).toBeNull();
    expect(getFacebookPageKind("https://www.ebay.com/itm/123")).toBeNull();
  });

  it("normalizes listing URLs", () => {
    expect(
      normalizeFacebookListingUrl(
        "https://www.facebook.com/marketplace/item/123/?ref=search"
      )
    ).toBe("https://www.facebook.com/marketplace/item/123");
  });

  it("normalizes visible text", () => {
    expect(normalizeVisibleText("  Milwaukee   drill \n $45 ")).toBe(
      "Milwaukee drill $45"
    );
  });

  it("maps selector confidence", () => {
    expect(selectorConfidence(true)).toBe("high");
    expect(selectorConfidence(false)).toBe("low");
  });
});
