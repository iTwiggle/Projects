/**
 * Injected parser bundle for Facebook Marketplace capture scripts.
 */
(function initFacebookParserGlobal() {
  if (globalThis.__marketplaceGoblinFacebookParser) {
    return;
  }

  function parseFacebookPrice(text) {
    if (!text) return null;
    const normalized = text.replace(/\u00a0/g, " ").trim();
    const match = normalized.match(
      /(?:US\s*\$|USD\s*\$?|\$)\s*([\d,]+(?:\.\d{1,2})?)/
    );
    if (!match) return null;
    const value = parseFloat(match[1].replace(/,/g, ""));
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function getFacebookPageKind(pageUrl) {
    try {
      const { hostname, pathname } = new URL(pageUrl);
      if (!hostname.includes("facebook.com")) return null;
      if (pathname.includes("/marketplace/item/")) return "listing";
      return null;
    } catch {
      return null;
    }
  }

  function normalizeFacebookListingUrl(href) {
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

  function normalizeVisibleText(text) {
    return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }

  function selectorConfidence(found) {
    return found ? "high" : "low";
  }

  globalThis.__marketplaceGoblinFacebookParser = {
    parseFacebookPrice,
    getFacebookPageKind,
    normalizeFacebookListingUrl,
    normalizeVisibleText,
    selectorConfidence,
    MARKETPLACE_LISTING_CAPTURE_SCHEMA_VERSION: "1.0",
    PLATFORM_FACEBOOK: "Facebook Marketplace",
  };
})();
