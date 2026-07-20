/**
 * Pure parsing helpers for Facebook Marketplace listing pages (testable without DOM).
 */

/**
 * @param {string} text
 * @returns {number | null}
 */
export function parseFacebookPrice(text) {
  if (!text) return null;
  const normalized = text.replace(/\u00a0/g, " ").trim();
  const match = normalized.match(
    /(?:US\s*\$|USD\s*\$?|\$)\s*([\d,]+(?:\.\d{1,2})?)/
  );
  if (!match) return null;
  const value = parseFloat(match[1].replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * @param {string} pageUrl
 * @returns {"listing" | null}
 */
export function getFacebookPageKind(pageUrl) {
  try {
    const { hostname, pathname } = new URL(pageUrl);
    if (!hostname.includes("facebook.com")) return null;
    if (pathname.includes("/marketplace/item/")) return "listing";
    return null;
  } catch {
    return null;
  }
}

/**
 * @param {string} href
 * @returns {string}
 */
export function normalizeFacebookListingUrl(href) {
  try {
    const url = new URL(href);
    if (!url.hostname.includes("facebook.com")) return href;
    url.hash = "";
    const path = url.pathname.replace(/\/+$/, "");
    return `${url.origin}${path}`;
  } catch {
    return href;
  }
}

/**
 * @param {string} text
 * @returns {string}
 */
export function normalizeVisibleText(text) {
  return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * @param {boolean} found
 * @returns {"high" | "medium" | "low"}
 */
export function selectorConfidence(found) {
  return found ? "high" : "low";
}
