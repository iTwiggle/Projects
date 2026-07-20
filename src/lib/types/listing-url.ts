export type ListingPlatform =
  | "facebook_marketplace"
  | "craigslist"
  | "offerup"
  | "ebay"
  | "unknown";

export const LISTING_PLATFORM_LABELS: Record<ListingPlatform, string> = {
  facebook_marketplace: "Facebook Marketplace",
  craigslist: "Craigslist",
  offerup: "OfferUp",
  ebay: "eBay",
  unknown: "Unknown",
};

export interface ListingLinkInfo {
  url: string | null;
  isValid: boolean;
  hasLink: boolean;
  platform: ListingPlatform;
  platformLabel: string;
  hostname: string | null;
}
