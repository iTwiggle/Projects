import type { ComparableSale, CompListingType } from "@/lib/types/comps";
import { COMP_PLATFORMS } from "@/lib/types/comps";
import type { DealCondition } from "@/lib/types/deal";

export interface QuickCompDefaults {
  platform: string;
  condition: DealCondition;
}

export function normalizeCompPlatform(platform: string): string {
  if (COMP_PLATFORMS.includes(platform as (typeof COMP_PLATFORMS)[number])) {
    return platform;
  }
  return "Other";
}

export function buildQuickComp(
  title: string,
  price: number,
  listingType: CompListingType,
  defaults: QuickCompDefaults
): Omit<ComparableSale, "id"> {
  return {
    title: title.trim(),
    price,
    listingType,
    platform: normalizeCompPlatform(defaults.platform),
    condition: defaults.condition,
    notes: "",
  };
}

export function isValidQuickComp(title: string, price: number): boolean {
  return title.trim().length > 0 && price > 0;
}
