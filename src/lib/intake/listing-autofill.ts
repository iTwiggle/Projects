import {
  buildParserTextFromHtmlExtract,
  extractListingFromHtml,
  hasUsableHtmlExtract,
  type HtmlListingExtract,
} from "@/lib/intake/listing-html-extract";
import { fetchListingHtml } from "@/lib/intake/listing-url-fetch";
import { normalizeListingUrl } from "@/lib/intake/listing-url";
import {
  parseListingWithConfidence,
  type ParsedListingResult,
} from "@/lib/intake/listing-parser";
import type { FieldConfidence } from "@/lib/intake/listing-parser";

export interface ListingAutofillResult {
  success: boolean;
  diagnostics: string[];
  parserText: string;
  htmlExtract: HtmlListingExtract | null;
  parseResult: ParsedListingResult | null;
  listingUrl: string | null;
  imageUrls: string[];
}

function maxConfidence(
  a: FieldConfidence,
  b: FieldConfidence
): FieldConfidence {
  const rank: Record<FieldConfidence, number> = {
    low: 0,
    medium: 1,
    high: 2,
  };
  return rank[b] > rank[a] ? b : a;
}

function mergeHtmlDirectFields(
  parseResult: ParsedListingResult,
  htmlExtract: HtmlListingExtract
): ParsedListingResult {
  const fields = { ...parseResult.fields };
  const confidence = { ...parseResult.confidence };

  if (htmlExtract.title) {
    fields.itemName = htmlExtract.title;
    confidence.itemName = maxConfidence(confidence.itemName, "high");
  }

  if (htmlExtract.price !== null) {
    fields.askingPrice = htmlExtract.price;
    confidence.askingPrice = maxConfidence(confidence.askingPrice, "high");
  }

  if (htmlExtract.description) {
    const desc = htmlExtract.description.slice(0, 500);
    fields.notes = fields.notes ? `${fields.notes}\n${desc}`.trim() : desc;
    confidence.category = confidence.category;
  }

  return { fields, confidence };
}

export async function attemptListingAutofill(
  url: string
): Promise<ListingAutofillResult> {
  const listingUrl = normalizeListingUrl(url);
  const diagnostics: string[] = [];

  if (!listingUrl) {
    return {
      success: false,
      diagnostics: ["Invalid listing URL."],
      parserText: "",
      htmlExtract: null,
      parseResult: null,
      listingUrl: null,
      imageUrls: [],
    };
  }

  diagnostics.push(`Fetching ${listingUrl} (browser CORS only)...`);

  const fetchResult = await fetchListingHtml(listingUrl);
  if (!fetchResult.ok) {
    return {
      success: false,
      diagnostics: [fetchResult.message],
      parserText: "",
      htmlExtract: null,
      parseResult: null,
      listingUrl,
      imageUrls: [],
    };
  }

  diagnostics.push("Fetch succeeded — parsing page metadata.");

  const htmlExtract = extractListingFromHtml(fetchResult.html, fetchResult.finalUrl);
  diagnostics.push(...htmlExtract.diagnostics);

  if (!hasUsableHtmlExtract(htmlExtract)) {
    return {
      success: false,
      diagnostics: [
        ...diagnostics,
        "Page loaded but no usable title, price, or description metadata was found.",
      ],
      parserText: "",
      htmlExtract,
      parseResult: null,
      listingUrl,
      imageUrls: htmlExtract.imageUrls,
    };
  }

  const parserText = buildParserTextFromHtmlExtract(htmlExtract);
  const parsed = parseListingWithConfidence(parserText);
  const parseResult = mergeHtmlDirectFields(parsed, htmlExtract);

  diagnostics.push("Fed extracted text into goblin listing parser.");

  return {
    success: true,
    diagnostics,
    parserText,
    htmlExtract,
    parseResult,
    listingUrl,
    imageUrls: htmlExtract.imageUrls,
  };
}
