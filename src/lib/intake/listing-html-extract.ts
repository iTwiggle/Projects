export interface HtmlListingExtract {
  title: string | null;
  price: number | null;
  description: string | null;
  imageUrls: string[];
  diagnostics: string[];
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractMetaProperty(html: string, property: string): string | null {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }

  return null;
}

function extractMetaName(html: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }

  return null;
}

function extractTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? stripTags(match[1]) : null;
}

function parsePriceValue(raw: string | null): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, "").match(/(\d+(?:\.\d{2})?)/);
  if (!cleaned?.[1]) return null;
  const value = parseFloat(cleaned[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function extractPriceFromHtml(html: string): number | null {
  const metaCandidates = [
    extractMetaProperty(html, "product:price:amount"),
    extractMetaProperty(html, "og:price:amount"),
    extractMetaName(html, "twitter:data1"),
  ];

  for (const candidate of metaCandidates) {
    const value = parsePriceValue(candidate);
    if (value !== null) return value;
  }

  const jsonLdPrice = html.match(/"price"\s*:\s*"?([\d,.]+)"?/i);
  if (jsonLdPrice?.[1]) {
    const value = parsePriceValue(jsonLdPrice[1]);
    if (value !== null) return value;
  }

  const dollarMatch = html.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
  if (dollarMatch?.[1]) {
    return parsePriceValue(dollarMatch[1]);
  }

  return null;
}

function resolveImageUrl(raw: string, pageUrl: string): string | null {
  try {
    return new URL(raw, pageUrl).href;
  } catch {
    return null;
  }
}

function extractImageUrls(html: string, pageUrl: string): string[] {
  const candidates = [
    extractMetaProperty(html, "og:image"),
    extractMetaProperty(html, "og:image:url"),
    extractMetaName(html, "twitter:image"),
  ].filter((value): value is string => !!value);

  const unique = new Set<string>();
  for (const candidate of candidates) {
    const resolved = resolveImageUrl(candidate, pageUrl);
    if (resolved) unique.add(resolved);
  }

  return [...unique].slice(0, 4);
}

function cleanListingTitle(title: string): string {
  return title
    .replace(/\s*[-|•]\s*(Facebook|Marketplace|OfferUp|Craigslist|eBay).*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

export function extractListingFromHtml(
  html: string,
  pageUrl: string
): HtmlListingExtract {
  const diagnostics: string[] = [];

  const title =
    extractMetaProperty(html, "og:title") ??
    extractMetaName(html, "twitter:title") ??
    extractTitleTag(html);

  const description =
    extractMetaProperty(html, "og:description") ??
    extractMetaName(html, "description") ??
    extractMetaName(html, "twitter:description");

  const price = extractPriceFromHtml(html);
  const imageUrls = extractImageUrls(html, pageUrl);

  if (title) diagnostics.push("Found page title metadata.");
  else diagnostics.push("No title metadata found in HTML.");

  if (price !== null) diagnostics.push(`Found price hint: $${price}.`);
  else diagnostics.push("No reliable price metadata found.");

  if (description) diagnostics.push("Found description metadata.");
  if (imageUrls.length > 0) {
    diagnostics.push(`Found ${imageUrls.length} image URL(s).`);
  }

  return {
    title: title ? cleanListingTitle(title) : null,
    price,
    description: description ? description.slice(0, 800) : null,
    imageUrls,
    diagnostics,
  };
}

export function buildParserTextFromHtmlExtract(
  extract: HtmlListingExtract
): string {
  const lines: string[] = [];

  if (extract.title) lines.push(extract.title);
  if (extract.price !== null) lines.push(`$${extract.price}`);
  if (extract.description) lines.push(extract.description);

  return lines.join("\n").trim();
}

export function hasUsableHtmlExtract(extract: HtmlListingExtract): boolean {
  return !!(extract.title || extract.price !== null || extract.description);
}
