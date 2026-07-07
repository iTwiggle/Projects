/**
 * Injected on demand via chrome.scripting.executeScript.
 * Depends on lib/facebook-parser-global.js being injected first.
 */
(function initFacebookCapture() {
  if (globalThis.__marketplaceGoblinCaptureFacebook) {
    return;
  }

  const parser = globalThis.__marketplaceGoblinFacebookParser;
  if (!parser) {
    console.error("[Marketplace Goblin] Facebook parser not loaded.");
    return;
  }

  const {
    parseFacebookPrice,
    getFacebookPageKind,
    normalizeFacebookListingUrl,
    normalizeVisibleText,
    selectorConfidence,
    MARKETPLACE_LISTING_CAPTURE_SCHEMA_VERSION,
    PLATFORM_FACEBOOK,
  } = parser;

  const MAX_RAW_TEXT = 8000;
  const MAX_TITLE = 300;
  const MAX_DESCRIPTION = 4000;

  function getVisibleRoot() {
    return (
      document.querySelector('[role="main"]') ||
      document.querySelector("main") ||
      document.body
    );
  }

  function queryText(selectors) {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const text = normalizeVisibleText(el?.textContent || "");
      if (text) return { text, selector };
    }
    return { text: "", selector: null };
  }

  function queryImage(selectors) {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const src =
        el?.getAttribute("src") ||
        el?.getAttribute("data-src") ||
        el?.getAttribute("xlink:href");
      if (src && /^https?:\/\//i.test(src)) {
        return { imageUrl: src, selector };
      }
    }
    return { imageUrl: undefined, selector: null };
  }

  function captureFacebookListing() {
    const pageUrl = globalThis.location?.href || "";
    const capturedAt = new Date().toISOString();

    if (getFacebookPageKind(pageUrl) !== "listing") {
      return {
        batch: {
          schemaVersion: MARKETPLACE_LISTING_CAPTURE_SCHEMA_VERSION,
          source: "extension",
          platform: PLATFORM_FACEBOOK,
          capturedAt,
          pageUrl,
          listing: {
            listingUrl: normalizeFacebookListingUrl(pageUrl),
            rawText: "",
            capturedAt,
            confidence: {},
          },
          selectorFallback: true,
        },
        stats: { valid: false, selectorFallback: true },
      };
    }

    const listingUrl = normalizeFacebookListingUrl(pageUrl);
    const root = getVisibleRoot();
    const rawText = normalizeVisibleText(root?.textContent || "").slice(
      0,
      MAX_RAW_TEXT
    );

    const titleResult = queryText([
      '[data-testid="marketplace-pdp-title"]',
      'h1[dir="auto"]',
      "h1",
    ]);

    const priceResult = queryText([
      '[data-testid="marketplace-pdp-price"]',
      'span[dir="auto"]',
    ]);

    let askingPrice = parseFacebookPrice(priceResult.text);
    if (askingPrice === null) {
      const priceMatch = rawText.match(
        /(?:US\s*\$|USD\s*\$?|\$)\s*([\d,]+(?:\.\d{1,2})?)/
      );
      if (priceMatch) {
        askingPrice = parseFacebookPrice(priceMatch[0]);
      }
    }

    const descriptionResult = queryText([
      '[data-testid="marketplace-pdp-description"]',
      '[data-ad-preview="message"]',
      'div[dir="auto"][class*="description"]',
    ]);

    const imageResult = queryImage([
      '[data-testid="marketplace-pdp-image"] img',
      'div[role="img"] img',
      'img[src*="fbcdn"]',
      'img[src*="scontent"]',
    ]);

    const hasStructuredFields =
      !!titleResult.text || askingPrice !== null || !!descriptionResult.text;

    const selectorFallback = !hasStructuredFields;

    const listing = {
      title: titleResult.text
        ? titleResult.text.slice(0, MAX_TITLE)
        : undefined,
      askingPrice: askingPrice ?? null,
      description: descriptionResult.text
        ? descriptionResult.text.slice(0, MAX_DESCRIPTION)
        : undefined,
      imageUrl: imageResult.imageUrl,
      listingUrl,
      rawText: rawText || listingUrl,
      capturedAt,
      confidence: {
        title: selectorConfidence(!!titleResult.text),
        askingPrice: selectorConfidence(askingPrice !== null),
        description: selectorConfidence(!!descriptionResult.text),
        imageUrl: selectorConfidence(!!imageResult.imageUrl),
        listingUrl: "high",
      },
    };

    return {
      batch: {
        schemaVersion: MARKETPLACE_LISTING_CAPTURE_SCHEMA_VERSION,
        source: "extension",
        platform: PLATFORM_FACEBOOK,
        capturedAt,
        pageUrl,
        listing,
        selectorFallback,
      },
      stats: {
        valid: !!listing.rawText,
        selectorFallback,
      },
    };
  }

  globalThis.__marketplaceGoblinCaptureFacebook = captureFacebookListing;
})();
