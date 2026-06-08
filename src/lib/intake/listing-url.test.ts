import { describe, expect, it } from "vitest";
import {
  detectListingPlatform,
  isValidListingUrl,
  normalizeListingUrl,
  resolveListingLink,
} from "@/lib/intake/listing-url";

describe("isValidListingUrl", () => {
  it("accepts http and https URLs", () => {
    expect(isValidListingUrl("https://www.facebook.com/marketplace/item/123")).toBe(
      true
    );
    expect(isValidListingUrl("http://losangeles.craigslist.org/abc")).toBe(true);
  });

  it("rejects invalid formats", () => {
    expect(isValidListingUrl("")).toBe(false);
    expect(isValidListingUrl("not a url")).toBe(false);
    expect(isValidListingUrl("ftp://example.com")).toBe(false);
  });
});

describe("normalizeListingUrl", () => {
  it("trims and strips hash", () => {
    expect(
      normalizeListingUrl("  https://offerup.com/item/1#top  ")
    ).toBe("https://offerup.com/item/1");
  });

  it("returns null for empty or invalid", () => {
    expect(normalizeListingUrl(null)).toBeNull();
    expect(normalizeListingUrl("")).toBeNull();
    expect(normalizeListingUrl("bad")).toBeNull();
  });
});

describe("detectListingPlatform", () => {
  it("detects supported platforms", () => {
    expect(
      detectListingPlatform(
        "https://www.facebook.com/marketplace/item/123456789"
      )
    ).toBe("facebook_marketplace");
    expect(
      detectListingPlatform("https://losangeles.craigslist.org/zip/d/item/123")
    ).toBe("craigslist");
    expect(detectListingPlatform("https://offerup.com/item/detail/1")).toBe(
      "offerup"
    );
    expect(
      detectListingPlatform("https://www.ebay.com/itm/123456789")
    ).toBe("ebay");
  });

  it("returns unknown for other hosts", () => {
    expect(detectListingPlatform("https://www.mercari.com/item/1")).toBe(
      "unknown"
    );
  });
});

describe("resolveListingLink", () => {
  it("resolves a valid listing link", () => {
    const link = resolveListingLink(
      "https://www.ebay.com/itm/123456789"
    );

    expect(link.hasLink).toBe(true);
    expect(link.isValid).toBe(true);
    expect(link.platform).toBe("ebay");
    expect(link.platformLabel).toBe("eBay");
    expect(link.hostname).toBe("ebay.com");
  });

  it("flags invalid user input without a stored link", () => {
    const link = resolveListingLink("not-a-url");

    expect(link.hasLink).toBe(false);
    expect(link.isValid).toBe(false);
    expect(link.platformLabel).toBe("Unknown");
  });
});
