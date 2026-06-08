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
    detectEbayListingTypeDetailed,
    extractEbaySearchQuery,
    isPromoOrPlaceholderTitle,
    isSponsoredRowText,
    normalizeEbayItemUrl,
    getEbayPageKind,
    COMP_CAPTURE_SCHEMA_VERSION,
    PLATFORM_EBAY,
  } = parser;

  const MAX_RAW_TEXT = 2000;
  const MAX_TITLE = 200;
  const MAX_COMPS = 50;

  function emptyStats() {
    return {
      scannedRows: 0,
      skippedRows: 0,
      duplicateRows: 0,
      validComps: 0,
      capturedThisRun: 0,
    };
  }

  function emptyBatch(pageUrl) {
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

  /**
   * @param {Element} card
   * @returns {"sponsored" | "promo" | "empty" | null}
   */
  function getCardSkipReason(card) {
    if (
      card.classList.contains("s-item--before-answer") ||
      card.classList.contains("s-item--free-banner") ||
      card.querySelector(".srp-river-answer, .s-item__empty-slot")
    ) {
      return "empty";
    }

    const sep = card.querySelector(".s-item__sep, .s-item__marketing");
    if (sep && isSponsoredRowText(sep.textContent || "")) {
      return "sponsored";
    }

    const tagBlock = card.querySelector(".s-item__title--tagblock");
    if (tagBlock && /^sponsored$/i.test(tagBlock.textContent.trim())) {
      return "sponsored";
    }

    if (card.querySelector('[class*="sponsored" i], [aria-label*="Sponsored" i]')) {
      return "sponsored";
    }

    const rawPreview = (card.textContent || "").replace(/\s+/g, " ").trim();
    if (isSponsoredRowText(rawPreview.slice(0, 80))) {
      const itemLink = card.querySelector("a[href*='/itm/']");
      if (!itemLink) return "sponsored";
    }

    const itemLink = card.querySelector("a[href*='/itm/']");
    if (!itemLink) {
      return "empty";
    }

    const titleLink =
      card.querySelector(".s-item__link") ||
      card.querySelector(".s-item__title a[href]") ||
      itemLink;

    let title = (titleLink?.textContent || "")
      .replace(/\s+/g, " ")
      .trim();

    if (title.toLowerCase().startsWith("new listing")) {
      title = title.replace(/^new listing\s*/i, "").trim();
    }

    if (isPromoOrPlaceholderTitle(title)) {
      return "promo";
    }

    return null;
  }

  /**
   * @param {Element} card
   * @param {string} pageUrl
   * @returns {import('../lib/schema.js').CapturedComp | null}
   */
  function extractCompFromCard(card, pageUrl) {
    const titleLink =
      card.querySelector(".s-item__link") ||
      card.querySelector(".s-item__title a[href]") ||
      card.querySelector("a[href*='/itm/']");

    let title = (titleLink?.textContent || "")
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

    const subtitleEl = card.querySelector(
      ".s-item__subtitle, .s-item__title--tagblock, .s-item__caption"
    );
    const subtitleText = subtitleEl?.textContent || "";
    const rawText = (card.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_RAW_TEXT);

    const listingMeta = detectEbayListingTypeDetailed(
      pageUrl,
      rawText,
      subtitleText
    );

    const url = normalizeEbayItemUrl(titleLink?.getAttribute("href") || "");
    const imageEl = card.querySelector("img.s-item__image-img, img[src]");
    const imageUrl =
      imageEl?.getAttribute("src") ||
      imageEl?.getAttribute("data-src") ||
      undefined;

    const capturedAt = new Date().toISOString();

    return {
      title: title.slice(0, MAX_TITLE),
      price,
      platform: PLATFORM_EBAY,
      listingType: listingMeta.listingType,
      url,
      imageUrl: imageUrl?.startsWith("http") ? imageUrl : undefined,
      capturedAt,
      rawText,
      confidence: {
        title: title ? "high" : "low",
        price: priceText ? "high" : "medium",
        listingType: listingMeta.confidence,
        platform: "high",
        condition: "low",
      },
    };
  }

  function captureSearchResults(pageUrl) {
    const stats = emptyStats();
    const cards = Array.from(
      document.querySelectorAll(
        ".srp-results .s-item, ul.srp-results li.s-item, .s-item"
      )
    );

    const comps = [];
    const seen = new Set();

    for (const card of cards) {
      stats.scannedRows += 1;

      const skipReason = getCardSkipReason(card);
      if (skipReason) {
        stats.skippedRows += 1;
        continue;
      }

      const comp = extractCompFromCard(card, pageUrl);
      if (!comp) {
        stats.skippedRows += 1;
        continue;
      }

      const key = `${comp.title.toLowerCase()}|${comp.price}|${comp.url || ""}`;
      if (seen.has(key)) {
        stats.duplicateRows += 1;
        continue;
      }

      seen.add(key);
      comps.push(comp);
      stats.capturedThisRun += 1;

      if (comps.length >= MAX_COMPS) {
        break;
      }
    }

    stats.validComps = comps.length;

    return {
      batch: {
        schemaVersion: COMP_CAPTURE_SCHEMA_VERSION,
        source: "extension",
        platform: PLATFORM_EBAY,
        searchQuery: extractEbaySearchQuery(pageUrl),
        capturedAt: new Date().toISOString(),
        pageUrl,
        comps,
      },
      stats,
    };
  }

  function captureSingleItemPage(pageUrl) {
    const stats = emptyStats();
    stats.scannedRows = 1;

    const titleEl =
      document.querySelector(
        "h1.x-item-title__mainTitle span, h1.x-item-title__mainTitle, [data-testid='x-item-title-label'], #itemTitle"
      ) || document.querySelector("h1");

    const priceEl =
      document.querySelector(
        ".x-price-primary .ux-textspans--BOLD, .x-price-primary span, [itemprop='price'], #prcIsum, .ux-main-price__price"
      ) || document.querySelector("[class*='price-primary']");

    const title = titleEl?.textContent?.replace(/\s+/g, " ").trim() || "";
    const priceText = priceEl?.textContent || "";
    const price = parsePrice(priceText);

    if (!title || isPromoOrPlaceholderTitle(title)) {
      stats.skippedRows = 1;
      return { batch: emptyBatch(pageUrl), stats };
    }

    if (price === null) {
      stats.skippedRows = 1;
      return { batch: emptyBatch(pageUrl), stats };
    }

    const mainPanel =
      document.querySelector("#CenterPanel, #mainContent, main") || document.body;
    const rawText = (mainPanel.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_RAW_TEXT);

    const listingMeta = detectEbayListingTypeDetailed(pageUrl, rawText, "");
    const imageEl = document.querySelector(
      "img[data-zoom-src], #icImg, .ux-image-carousel img, [itemprop='image']"
    );
    const imageUrl =
      imageEl?.getAttribute("data-zoom-src") ||
      imageEl?.getAttribute("src") ||
      undefined;

    const capturedAt = new Date().toISOString();
    const comp = {
      title: title.slice(0, MAX_TITLE),
      price,
      platform: PLATFORM_EBAY,
      listingType: listingMeta.listingType,
      url: normalizeEbayItemUrl(pageUrl) || pageUrl.split("?")[0],
      imageUrl: imageUrl?.startsWith("http") ? imageUrl : undefined,
      capturedAt,
      rawText,
      confidence: {
        title: "high",
        price: priceText ? "high" : "medium",
        listingType: listingMeta.confidence,
        platform: "high",
        condition: "low",
      },
    };

    stats.validComps = 1;
    stats.capturedThisRun = 1;

    return {
      batch: {
        schemaVersion: COMP_CAPTURE_SCHEMA_VERSION,
        source: "extension",
        platform: PLATFORM_EBAY,
        searchQuery: title.slice(0, 120),
        capturedAt,
        pageUrl,
        comps: [comp],
      },
      stats,
    };
  }

  /**
   * @returns {{ batch: import('../lib/schema.js').CompCaptureBatch, stats: object }}
   */
  function captureVisibleEbayComps() {
    const pageUrl = globalThis.location?.href || "";
    const pageKind = getEbayPageKind(pageUrl);

    if (pageKind === "search") {
      return captureSearchResults(pageUrl);
    }

    if (pageKind === "item") {
      return captureSingleItemPage(pageUrl);
    }

    return {
      batch: emptyBatch(pageUrl),
      stats: emptyStats(),
    };
  }

  globalThis.__marketplaceGoblinCaptureEbay = captureVisibleEbayComps;
})();
