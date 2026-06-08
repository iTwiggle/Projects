import { describe, expect, it } from "vitest";
import {
  detectEbayListingType,
  extractEbaySearchQuery,
  isPromoOrPlaceholderTitle,
  normalizeEbayItemUrl,
  parsePrice,
} from "../../../extension/lib/ebay-parser.js";

describe("extension ebay-parser", () => {
  it("parses USD prices", () => {
    expect(parsePrice("$89.99")).toBe(89.99);
    expect(parsePrice("US $1,234.50")).toBe(1234.5);
    expect(parsePrice("no price")).toBeNull();
  });

  it("detects sold vs listed", () => {
    expect(
      detectEbayListingType(
        "https://www.ebay.com/sch/i.html?LH_Sold=1",
        "Milwaukee drill",
        ""
      )
    ).toBe("sold");
    expect(
      detectEbayListingType(
        "https://www.ebay.com/sch/i.html",
        "Milwaukee drill Buy It Now",
        ""
      )
    ).toBe("listed");
  });

  it("extracts search query from URL", () => {
    expect(
      extractEbaySearchQuery(
        "https://www.ebay.com/sch/i.html?_nkw=Milwaukee+M18"
      )
    ).toBe("Milwaukee M18");
  });

  it("filters promo placeholders", () => {
    expect(isPromoOrPlaceholderTitle("Shop on eBay")).toBe(true);
    expect(isPromoOrPlaceholderTitle("Milwaukee M18 Drill")).toBe(false);
  });

  it("normalizes item URLs", () => {
    expect(
      normalizeEbayItemUrl("https://www.ebay.com/itm/123?hash=abc")
    ).toBe("https://www.ebay.com/itm/123");
    expect(normalizeEbayItemUrl("https://example.com/item")).toBeUndefined();
  });
});
