import { describe, expect, it } from "vitest";
import { parseListingWithConfidence } from "@/lib/intake/listing-parser";

describe("parseListingWithConfidence", () => {
  it("parses $45 price", () => {
    const { fields, confidence } = parseListingWithConfidence(
      "Makita Drill\n$45\nGood condition"
    );
    expect(fields.itemName).toBe("Makita Drill");
    expect(fields.askingPrice).toBe(45);
    expect(confidence.askingPrice).toBe("high");
  });

  it("parses $45 OBO", () => {
    const { fields } = parseListingWithConfidence(
      "Vintage Lamp\n$45 OBO\nPickup only downtown"
    );
    expect(fields.askingPrice).toBe(45);
    expect(fields.notes.toLowerCase()).toContain("pickup");
  });

  it("parses 45 firm without dollar sign", () => {
    const { fields, confidence } = parseListingWithConfidence(
      "Bookshelf\n45 firm\nSolid wood"
    );
    expect(fields.askingPrice).toBe(45);
    expect(confidence.askingPrice).toBe("medium");
  });

  it("parses listed for 45", () => {
    const { fields } = parseListingWithConfidence(
      "Office chair\nListed for 45\nAdjustable height"
    );
    expect(fields.askingPrice).toBe(45);
  });

  it("parses free listings", () => {
    const { fields, confidence } = parseListingWithConfidence(
      "Moving sale couch\nFree\nPickup only"
    );
    expect(fields.askingPrice).toBe(0);
    expect(confidence.askingPrice).toBe("high");
    expect(fields.notes.toLowerCase()).toContain("pickup");
  });

  it("strips condition words mixed into title", () => {
    const { fields } = parseListingWithConfidence(
      "Le Creuset Dutch Oven - Good condition\n$40"
    );
    expect(fields.itemName).toBe("Le Creuset Dutch Oven");
    expect(fields.condition).toBe("Good");
  });

  it("detects tools category from keywords", () => {
    const { fields, confidence } = parseListingWithConfidence(
      "Makita 18V drill kit\n$55 firm"
    );
    expect(fields.category).toBe("Tools & Hardware");
    expect(confidence.category).not.toBe("low");
  });

  it("returns low confidence for sparse listings", () => {
    const { confidence } = parseListingWithConfidence("a");
    expect(confidence.itemName).toBe("low");
    expect(confidence.askingPrice).toBe("low");
  });
});
