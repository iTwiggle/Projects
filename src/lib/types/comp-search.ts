export type CompSearchQuerySource = "identity" | "itemName";

export type CompSearchPlatform =
  | "ebaySold"
  | "ebayActive"
  | "facebookMarketplace"
  | "craigslist"
  | "googleShopping"
  | "googleSearch";

export interface CompSearchLink {
  platform: CompSearchPlatform;
  label: string;
  url: string;
}

export interface CompSearchQuery {
  query: string;
  source: CompSearchQuerySource;
  sourceLabel: string;
  links: CompSearchLink[];
}
