import type {
  CompSearchLink,
  CompSearchPlatform,
  CompSearchQuery,
  CompSearchQuerySource,
} from "@/lib/types/comp-search";
import type { ItemIdentity } from "@/lib/types/item-identity";

const SOURCE_LABELS: Record<CompSearchQuerySource, string> = {
  identity: "Identity-based",
  itemName: "Item-name fallback",
};

const PLATFORM_LABELS: Record<CompSearchPlatform, string> = {
  ebaySold: "eBay sold",
  ebayActive: "eBay active",
  facebookMarketplace: "Facebook Marketplace",
  craigslist: "Craigslist",
  googleShopping: "Google Shopping",
  googleSearch: "Google Search",
};

function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function isStorageVariant(variant: string): boolean {
  return /\d+\s*(gb|tb)\b/i.test(variant);
}

export function shouldUseIdentityForCompSearch(identity: ItemIdentity): boolean {
  if (identity.hasConflict) return false;
  if (identity.confidence !== "medium" && identity.confidence !== "high") {
    return false;
  }
  return Boolean(identity.brand || identity.model || identity.productFamily);
}

export function buildIdentityCompSearchQuery(identity: ItemIdentity): string {
  const parts: string[] = [];

  if (identity.confidence === "high") {
    if (identity.brand) parts.push(identity.brand);
    if (
      identity.productFamily &&
      identity.productFamily.toLowerCase() !== identity.brand?.toLowerCase()
    ) {
      parts.push(identity.productFamily);
    }
    if (identity.model) parts.push(identity.model);
    if (identity.variant && isStorageVariant(identity.variant)) {
      parts.push(identity.variant.replace(/[()]/g, "").trim());
    }
  } else {
    if (identity.brand) parts.push(identity.brand);
    if (
      identity.productFamily &&
      identity.productFamily.toLowerCase() !== identity.brand?.toLowerCase()
    ) {
      parts.push(identity.productFamily);
    }
    if (identity.model && identity.brand) {
      parts.push(identity.model);
    }
  }

  return normalizeWhitespace(parts.join(" "));
}

export function buildItemNameCompSearchQuery(itemName: string): string {
  return normalizeWhitespace(itemName);
}

export function encodeCompSearchQuery(query: string): string {
  return encodeURIComponent(query);
}

export function buildEbaySoldSearchUrl(query: string): string {
  const encoded = encodeCompSearchQuery(query);
  return `https://www.ebay.com/sch/i.html?_nkw=${encoded}&LH_Sold=1&LH_Complete=1`;
}

export function buildEbayActiveSearchUrl(query: string): string {
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeCompSearchQuery(query)}`;
}

export function buildFacebookMarketplaceSearchUrl(query: string): string {
  return `https://www.facebook.com/marketplace/search/?query=${encodeCompSearchQuery(query)}`;
}

export function buildCraigslistSearchUrl(query: string): string {
  return `https://www.craigslist.org/search/sss?query=${encodeCompSearchQuery(query)}`;
}

export function buildGoogleShoppingSearchUrl(query: string): string {
  return `https://www.google.com/search?tbm=shop&q=${encodeCompSearchQuery(query)}`;
}

export function buildGoogleSearchUrl(query: string): string {
  const soldQuery = normalizeWhitespace(`${query} sold price`);
  return `https://www.google.com/search?q=${encodeCompSearchQuery(soldQuery)}`;
}

export function buildCompSearchLinks(query: string): CompSearchLink[] {
  const platforms: CompSearchPlatform[] = [
    "ebaySold",
    "ebayActive",
    "facebookMarketplace",
    "craigslist",
    "googleShopping",
    "googleSearch",
  ];

  const urlBuilders: Record<CompSearchPlatform, (q: string) => string> = {
    ebaySold: buildEbaySoldSearchUrl,
    ebayActive: buildEbayActiveSearchUrl,
    facebookMarketplace: buildFacebookMarketplaceSearchUrl,
    craigslist: buildCraigslistSearchUrl,
    googleShopping: buildGoogleShoppingSearchUrl,
    googleSearch: buildGoogleSearchUrl,
  };

  return platforms.map((platform) => ({
    platform,
    label: PLATFORM_LABELS[platform],
    url: urlBuilders[platform](query),
  }));
}

export function buildCompSearchQuery(
  itemName: string,
  identity: ItemIdentity
): CompSearchQuery | null {
  const fallbackQuery = buildItemNameCompSearchQuery(itemName);
  const useIdentity = shouldUseIdentityForCompSearch(identity);
  const identityQuery = useIdentity
    ? buildIdentityCompSearchQuery(identity)
    : "";

  let query = useIdentity && identityQuery ? identityQuery : fallbackQuery;
  let source: CompSearchQuerySource =
    useIdentity && identityQuery ? "identity" : "itemName";

  if (!query) {
    if (identityQuery) {
      query = identityQuery;
      source = "identity";
    } else {
      return null;
    }
  }

  return {
    query,
    source,
    sourceLabel: SOURCE_LABELS[source],
    links: buildCompSearchLinks(query),
  };
}
