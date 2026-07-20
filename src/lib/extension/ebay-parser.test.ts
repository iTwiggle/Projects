import { describe, expect, it } from "vitest";
import {
  detectEbayListingType,
  detectEbayListingTypeDetailed,
  extractEbaySearchQuery,
  getEbayPageKind,
  hasSoldSearchContext,
  isPromoOrPlaceholderTitle,
  isSponsoredRowText,
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

  it("detects sold search context from LH_Sold and LH_Complete", () => {
    expect(
      hasSoldSearchContext(
        "https://www.ebay.com/sch/i.html?_nkw=drill&LH_Sold=1"
      )
    ).toBe(true);
    expect(
      hasSoldSearchContext(
        "https://www.ebay.com/sch/i.html?_nkw=drill&LH_Complete=1"
      )
    ).toBe(true);
    expect(
      hasSoldSearchContext("https://www.ebay.com/sch/i.html?_nkw=drill")
    ).toBe(false);
  });

  it("assigns listing type confidence for ambiguous rows", () => {
    const soldUrl =
      "https://www.ebay.com/sch/i.html?LH_Sold=1&LH_Complete=1";

    expect(
      detectEbayListingTypeDetailed(soldUrl, "Milwaukee drill sold Mar 12", "")
    ).toEqual({ listingType: "sold", confidence: "high" });

    expect(
      detectEbayListingTypeDetailed(
        soldUrl,
        "Milwaukee drill sold Mar 12 Buy It Now",
        ""
      )
    ).toEqual({ listingType: "sold", confidence: "low" });

    expect(
      detectEbayListingTypeDetailed(soldUrl, "Milwaukee drill", "")
    ).toEqual({ listingType: "sold", confidence: "medium" });

    expect(
      detectEbayListingTypeDetailed(
        "https://www.ebay.com/sch/i.html",
        "Milwaukee drill",
        ""
      )
    ).toEqual({ listingType: "listed", confidence: "medium" });
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
    expect(isPromoOrPlaceholderTitle("Sponsored")).toBe(true);
    expect(isPromoOrPlaceholderTitle("Milwaukee M18 Drill")).toBe(false);
  });

  it("detects sponsored row text", () => {
    expect(isSponsoredRowText("Sponsored")).toBe(true);
    expect(isSponsoredRowText("Advertisement")).toBe(true);
    expect(isSponsoredRowText("Milwaukee M18 Fuel")).toBe(false);
  });

  it("classifies eBay page kinds", () => {
    expect(
      getEbayPageKind("https://www.ebay.com/sch/i.html?_nkw=drill")
    ).toBe("search");
    expect(getEbayPageKind("https://www.ebay.com/b/123")).toBe("search");
    expect(getEbayPageKind("https://www.ebay.com/itm/123456")).toBe("item");
    expect(getEbayPageKind("https://www.ebay.com/usr/seller")).toBeNull();
  });

  it("normalizes item URLs", () => {
    expect(
      normalizeEbayItemUrl("https://www.ebay.com/itm/123?hash=abc")
    ).toBe("https://www.ebay.com/itm/123");
    expect(normalizeEbayItemUrl("https://example.com/item")).toBeUndefined();
  });
});
