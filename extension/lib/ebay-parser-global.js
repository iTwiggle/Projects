/**
 * Classic script — attaches parser utilities to globalThis for content script injection.
 */
(function attachEbayParser(global) {
  if (global.__marketplaceGoblinEbayParser) {
    return;
  }

  const COMP_CAPTURE_SCHEMA_VERSION = "1.0";
  const PLATFORM_EBAY = "eBay";

  function parsePrice(text) {
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

  function detectEbayListingType(pageUrl, cardText, subtitleText = "") {
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

  function extractEbaySearchQuery(pageUrl) {
    try {
      const url = new URL(pageUrl);
      return url.searchParams.get("_nkw")?.trim() ?? "";
    } catch {
      return "";
    }
  }

  function isPromoOrPlaceholderTitle(title) {
    const lower = title.toLowerCase().trim();
    return (
      !lower ||
      lower === "shop on ebay" ||
      lower.startsWith("new listing") ||
      lower === "sponsored"
    );
  }

  function normalizeEbayItemUrl(href) {
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

  global.__marketplaceGoblinEbayParser = {
    parsePrice,
    detectEbayListingType,
    extractEbaySearchQuery,
    isPromoOrPlaceholderTitle,
    normalizeEbayItemUrl,
    COMP_CAPTURE_SCHEMA_VERSION,
    PLATFORM_EBAY,
  };
})(globalThis);
