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
 * @param {string} cardText
 * @param {string} [subtitleText]
 * @returns {"sold" | "listed"}
 */
export function detectEbayListingType(pageUrl, cardText, subtitleText = "") {
  const haystack = `${pageUrl} ${cardText} ${subtitleText}`.toLowerCase();
  if (
    haystack.includes("lh_sold=1") ||
    haystack.includes("lh_complete=1") ||
    /\bsold\b/.test(haystack) ||
    /\bended\b/.test(haystack)
  ) {
    return "sold";
  }
  return "listed";
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
  return (
    !lower ||
    lower === "shop on ebay" ||
    lower.startsWith("new listing") ||
    lower === "sponsored"
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
