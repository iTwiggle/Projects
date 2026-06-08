/**
 * Injected on demand via chrome.scripting.executeScript.
 * Depends on lib/ebay-parser-global.js being injected first.
 */
(function initEbayCapture() {
  if (globalThis.__marketplaceGoblinCaptureEbay) {
    return;
  }

  const parser = globalThis.__marketplaceGoblinEbayParser;
  if (!parser) {
    console.error("[Marketplace Goblin] eBay parser not loaded.");
    return;
  }

  const {
    parsePrice,
    detectEbayListingType,
    extractEbaySearchQuery,
    isPromoOrPlaceholderTitle,
    normalizeEbayItemUrl,
    COMP_CAPTURE_SCHEMA_VERSION,
    PLATFORM_EBAY,
  } = parser;

  const MAX_RAW_TEXT = 2000;
  const MAX_TITLE = 200;

  /**
   * @param {Element} card
   * @returns {import('../lib/schema.js').CapturedComp | null}
   */
  function extractCompFromCard(card) {
    const titleLink =
      card.querySelector(".s-item__link") ||
      card.querySelector(".s-item__title a[href]") ||
      card.querySelector("a[href*='/itm/']");

    const titleEl =
      card.querySelector(".s-item__title") ||
      card.querySelector('[role="heading"]') ||
      titleLink;

    let title = (titleEl?.textContent || titleLink?.textContent || "")
      .replace(/\s+/g, " ")
      .trim();

    if (title.toLowerCase().startsWith("new listing")) {
      title = title.replace(/^new listing\s*/i, "").trim();
    }

    if (isPromoOrPlaceholderTitle(title)) {
      return null;
    }

    const priceEl =
      card.querySelector(".s-item__price") ||
      card.querySelector(".s-item__detail--primary") ||
      card.querySelector('[class*="price"]');

    const priceText = priceEl?.textContent || "";
    const price = parsePrice(priceText);
    if (price === null) {
      return null;
    }

    const subtitleEl = card.querySelector(".s-item__subtitle, .s-item__title--tagblock");
    const subtitleText = subtitleEl?.textContent || "";
    const rawText = (card.textContent || "").replace(/\s+/g, " ").trim().slice(0, MAX_RAW_TEXT);
    const pageUrl = globalThis.location?.href || "";
    const listingType = detectEbayListingType(pageUrl, rawText, subtitleText);

    const url = normalizeEbayItemUrl(titleLink?.getAttribute("href") || "");
    const imageEl = card.querySelector("img.s-item__image-img, img[src]");
    const imageUrl = imageEl?.getAttribute("src") || imageEl?.getAttribute("data-src") || undefined;

    const capturedAt = new Date().toISOString();

    return {
      title: title.slice(0, MAX_TITLE),
      price,
      platform: PLATFORM_EBAY,
      listingType,
      url,
      imageUrl: imageUrl?.startsWith("http") ? imageUrl : undefined,
      capturedAt,
      rawText,
      confidence: {
        title: title ? "high" : "low",
        price: priceText ? "high" : "medium",
        listingType:
          listingType === "sold" &&
          (pageUrl.includes("LH_Sold=1") || /\bsold\b/i.test(subtitleText))
            ? "high"
            : "medium",
        platform: "high",
        condition: "low",
      },
    };
  }

  /**
   * @returns {import('../lib/schema.js').CompCaptureBatch}
   */
  function captureVisibleEbayComps() {
    const pageUrl = globalThis.location?.href || "";
    const pathname = globalThis.location?.pathname || "";

    if (!pathname.includes("/sch/") && !pathname.includes("/b/")) {
      return {
        schemaVersion: COMP_CAPTURE_SCHEMA_VERSION,
        source: "extension",
        platform: PLATFORM_EBAY,
        searchQuery: extractEbaySearchQuery(pageUrl),
        capturedAt: new Date().toISOString(),
        pageUrl,
        comps: [],
      };
    }

    const cards = Array.from(
      document.querySelectorAll(".srp-results .s-item, ul.srp-results li.s-item, .s-item")
    ).filter((card) => !card.classList.contains("s-item--before-answer"));

    const comps = [];
    const seen = new Set();

    for (const card of cards) {
      const comp = extractCompFromCard(card);
      if (!comp) continue;

      const key = `${comp.title.toLowerCase()}|${comp.price}|${comp.url || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      comps.push(comp);

      if (comps.length >= 50) break;
    }

    return {
      schemaVersion: COMP_CAPTURE_SCHEMA_VERSION,
      source: "extension",
      platform: PLATFORM_EBAY,
      searchQuery: extractEbaySearchQuery(pageUrl),
      capturedAt: new Date().toISOString(),
      pageUrl,
      comps,
    };
  }

  globalThis.__marketplaceGoblinCaptureEbay = captureVisibleEbayComps;
})();
