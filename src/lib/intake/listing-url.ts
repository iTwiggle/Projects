import {
  LISTING_PLATFORM_LABELS,
  type ListingLinkInfo,
  type ListingPlatform,
} from "@/lib/types/listing-url";

const FACEBOOK_HOSTS = new Set([
  "facebook.com",
  "m.facebook.com",
  "www.facebook.com",
  "l.facebook.com",
  "fb.com",
  "fb.me",
]);

const OFFERUP_HOSTS = new Set([
  "offerup.com",
  "www.offerup.com",
  "offerup.co",
  "www.offerup.co",
]);

function stripTrailingSlash(path: string): string {
  return path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
}

export function isValidListingUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeListingUrl(
  raw: string | null | undefined
): string | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!isValidListingUrl(trimmed)) return null;

  const parsed = new URL(trimmed);
  parsed.hash = "";
  return stripTrailingSlash(parsed.toString());
}

export function parseListingHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isCraigslistHost(hostname: string): boolean {
  return hostname === "craigslist.org" || hostname.endsWith(".craigslist.org");
}

function isEbayHost(hostname: string): boolean {
  return hostname === "ebay.com" || hostname.endsWith(".ebay.com");
}

function isFacebookMarketplaceUrl(url: string, hostname: string): boolean {
  if (!FACEBOOK_HOSTS.has(hostname) && !hostname.endsWith(".facebook.com")) {
    return false;
  }

  try {
    const { pathname } = new URL(url);
    const path = pathname.toLowerCase();
    if (path.includes("/marketplace")) return true;
    if (hostname === "fb.com" || hostname === "fb.me") return true;
    return FACEBOOK_HOSTS.has(hostname);
  } catch {
    return false;
  }
}

export function detectListingPlatform(url: string): ListingPlatform {
  const hostname = parseListingHostname(url);
  if (!hostname) return "unknown";

  if (isFacebookMarketplaceUrl(url, hostname)) {
    return "facebook_marketplace";
  }
  if (isCraigslistHost(hostname)) return "craigslist";
  if (OFFERUP_HOSTS.has(hostname)) return "offerup";
  if (isEbayHost(hostname)) return "ebay";

  return "unknown";
}

export function resolveListingLink(
  listingUrl: string | null | undefined
): ListingLinkInfo {
  const normalized = normalizeListingUrl(listingUrl);
  const hasLink = normalized !== null;

  if (!hasLink) {
    const raw = typeof listingUrl === "string" ? listingUrl.trim() : "";
    const invalidAttempt = raw.length > 0 && !isValidListingUrl(raw);

    return {
      url: null,
      isValid: !invalidAttempt,
      hasLink: false,
      platform: "unknown",
      platformLabel: LISTING_PLATFORM_LABELS.unknown,
      hostname: null,
    };
  }

  const platform = detectListingPlatform(normalized);

  return {
    url: normalized,
    isValid: true,
    hasLink: true,
    platform,
    platformLabel: LISTING_PLATFORM_LABELS[platform],
    hostname: parseListingHostname(normalized),
  };
}
