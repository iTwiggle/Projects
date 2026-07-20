/**
 * Pure parsing helpers for eBay listing cards (testable without DOM).
 */

/**
 * @param {string} text
 * @returns {number | null}
 */
export function parsePrice(text) {
  if (!text) return null;
  const normalized = text.replace(/\u00a0/g, " ").trim();
  const match = normalized.match(
    /(?:US\s*\$|USD\s*\$?|CA\s*\$|C\s*\$|\$|£|€)\s*([\d,]+(?:\.\d{1,2})?)/
  );
  if (!match) {
    const fallback = normalized.match(/([\d,]+(?:\.\d{1,2})?)/);
    if (!fallback) return null;
    const value = parseFloat(fallback[1].replace(/,/g, ""));
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  const value = parseFloat(match[1].replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * @param {string} pageUrl
 * @returns {boolean}
 */
export function hasSoldSearchContext(pageUrl) {
  try {
    const url = new URL(pageUrl);
    return (
      url.searchParams.get("LH_Sold") === "1" ||
      url.searchParams.get("LH_Complete") === "1"
    );
  } catch {
    return (
      pageUrl.includes("LH_Sold=1") || pageUrl.includes("LH_Complete=1")
    );
  }
}

/**
 * @param {string} pageUrl
 * @param {string} cardText
 * @param {string} [subtitleText]
 * @returns {{ listingType: "sold" | "listed", confidence: "low" | "medium" | "high" }}
 */
export function detectEbayListingTypeDetailed(
  pageUrl,
  cardText,
  subtitleText = ""
) {
  const row = `${cardText} ${subtitleText}`.toLowerCase();
  const soldContext = hasSoldSearchContext(pageUrl);
  const hasSoldText =
    /\bsold\b/.test(row) ||
    /\bended\b/.test(row) ||
    /\bsold\s+[a-z]{3}\s+\d{1,2}/i.test(row);
  const hasActiveListingText =
    /\bbuy it now\b/.test(row) ||
    /\bor best offer\b/.test(row) ||
    /\bbest offer\b/.test(row) ||
    /\badd to (cart|watchlist)\b/.test(row) ||
    /\b\d+\s+available\b/.test(row);

  if (hasSoldText && !hasActiveListingText) {
    return {
      listingType: "sold",
      confidence: soldContext ? "high" : "medium",
    };
  }

  if (hasSoldText && hasActiveListingText) {
    return { listingType: "sold", confidence: "low" };
  }

  if (soldContext && !hasActiveListingText) {
    return { listingType: "sold", confidence: "medium" };
  }

  if (soldContext && hasActiveListingText) {
    return { listingType: "listed", confidence: "low" };
  }

  if (hasActiveListingText) {
    return { listingType: "listed", confidence: "high" };
  }

  return {
    listingType: "listed",
    confidence: soldContext ? "low" : "medium",
  };
}

/**
 * @param {string} pageUrl
 * @param {string} cardText
 * @param {string} [subtitleText]
 * @returns {"sold" | "listed"}
 */
export function detectEbayListingType(pageUrl, cardText, subtitleText = "") {
  return detectEbayListingTypeDetailed(pageUrl, cardText, subtitleText)
    .listingType;
}

/**
 * @param {string} pageUrl
 * @returns {string}
 */
export function extractEbaySearchQuery(pageUrl) {
  try {
    const url = new URL(pageUrl);
    return url.searchParams.get("_nkw")?.trim() ?? "";
  } catch {
    return "";
  }
}

/**
 * @param {string} title
 * @returns {boolean}
 */
export function isPromoOrPlaceholderTitle(title) {
  const lower = title.toLowerCase().trim();
  if (!lower) return true;

  const promoPatterns = [
    /^shop on ebay$/,
    /^sponsored$/,
    /^advertisement$/,
    /^ad$/,
    /^results matching fewer words$/,
    /^more items related to/,
    /^custom results$/,
  ];

  return promoPatterns.some((pattern) => pattern.test(lower));
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function isSponsoredRowText(text) {
  const lower = text.toLowerCase();
  return (
    /\bsponsored\b/.test(lower) ||
    /\badvertisement\b/.test(lower) ||
    /\bpromoted listing\b/.test(lower)
  );
}

/**
 * @param {string} href
 * @returns {string | undefined}
 */
export function normalizeEbayItemUrl(href) {
  if (!href) return undefined;
  try {
    const url = new URL(href, "https://www.ebay.com");
    if (!url.hostname.includes("ebay.com")) return undefined;
    if (!url.pathname.includes("/itm/")) return undefined;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

/**
 * @param {string} pageUrl
 * @returns {"search" | "item" | null}
 */
export function getEbayPageKind(pageUrl) {
  try {
    const { pathname } = new URL(pageUrl);
    if (pathname.includes("/sch/") || pathname.includes("/b/")) {
      return "search";
    }
    if (pathname.includes("/itm/")) {
      return "item";
    }
    return null;
  } catch {
    return null;
  }
}
