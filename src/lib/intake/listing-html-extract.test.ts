import { describe, expect, it } from "vitest";
import {
  buildParserTextFromHtmlExtract,
  extractListingFromHtml,
  hasUsableHtmlExtract,
} from "@/lib/intake/listing-html-extract";

const sampleHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="Makita 18V Drill Kit" />
  <meta property="og:description" content="Includes two batteries and charger. Good condition." />
  <meta property="product:price:amount" content="45.00" />
  <meta property="og:image" content="https://cdn.example.com/drill.jpg" />
  <title>Makita 18V Drill Kit - Marketplace</title>
</head>
<body></body>
</html>
`;

describe("extractListingFromHtml", () => {
  it("extracts title, price, description, and images", () => {
    const result = extractListingFromHtml(
      sampleHtml,
      "https://www.facebook.com/marketplace/item/1"
    );

    expect(result.title).toBe("Makita 18V Drill Kit");
    expect(result.price).toBe(45);
    expect(result.description).toContain("two batteries");
    expect(result.imageUrls).toContain("https://cdn.example.com/drill.jpg");
    expect(hasUsableHtmlExtract(result)).toBe(true);
  });

  it("builds parser text from extracted fields", () => {
    const extract = extractListingFromHtml(sampleHtml, "https://example.com");
    const text = buildParserTextFromHtmlExtract(extract);

    expect(text).toContain("Makita 18V Drill Kit");
    expect(text).toContain("$45");
    expect(text).toContain("batteries");
  });
});
