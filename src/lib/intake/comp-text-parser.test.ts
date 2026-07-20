import { describe, expect, it } from "vitest";
import {
  detectCompListingType,
  detectCompPlatform,
  parseCompTextBatch,
  parseCompTextBlock,
  splitCompTextBlocks,
} from "@/lib/intake/comp-text-parser";

describe("splitCompTextBlocks", () => {
  it("splits on blank lines", () => {
    const blocks = splitCompTextBlocks(
      "Item A\n$40 sold on eBay\n\nItem B\n$55\nCraigslist asking"
    );
    expect(blocks).toHaveLength(2);
  });
});

describe("detectCompPlatform", () => {
  it("detects marketplace platforms", () => {
    expect(detectCompPlatform("Sold on eBay for $50").platform).toBe("eBay");
    expect(detectCompPlatform("Facebook Marketplace listing").platform).toBe(
      "Facebook Marketplace"
    );
    expect(detectCompPlatform("Craigslist post").platform).toBe("Craigslist");
    expect(detectCompPlatform("OfferUp item").platform).toBe("OfferUp");
  });
});

describe("detectCompListingType", () => {
  it("detects sold vs listed", () => {
    expect(detectCompListingType("Sold for $40").listingType).toBe("sold");
    expect(detectCompListingType("Asking $40 OBO").listingType).toBe("listed");
  });
});

describe("parseCompTextBlock", () => {
  it("parses eBay sold comp text", () => {
    const draft = parseCompTextBlock(`Makita 18V Drill Kit
Sold on eBay
$45.00
Good condition, includes charger`);

    expect(draft?.title).toContain("Makita");
    expect(draft?.price).toBe(45);
    expect(draft?.listingType).toBe("sold");
    expect(draft?.platform).toBe("eBay");
  });

  it("parses craigslist listed comp", () => {
    const draft = parseCompTextBlock(`Vintage dresser
Craigslist asking $120 OBO
Fair condition`);

    expect(draft?.price).toBe(120);
    expect(draft?.listingType).toBe("listed");
    expect(draft?.platform).toBe("Craigslist");
  });
});

describe("parseCompTextBatch", () => {
  it("parses multiple comps", () => {
    const drafts = parseCompTextBatch(`iPhone 13 128GB
Sold eBay $380

OfferUp listed
Samsung TV $200 asking`);

    expect(drafts).toHaveLength(2);
    expect(drafts[0]?.platform).toBe("eBay");
    expect(drafts[1]?.platform).toBe("OfferUp");
  });
});
