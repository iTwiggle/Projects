import type { ComparableSale } from "@/lib/types/comps";
import type { DealCategory, DealInput } from "@/lib/types/deal";
import type {
  IdentityConfidence,
  ItemIdentity,
} from "@/lib/types/item-identity";
import { EMPTY_ITEM_IDENTITY } from "@/lib/types/item-identity";

export interface ItemIdentitySources {
  /** Raw listing / OCR text not yet in notes. */
  listingText?: string;
  ocrText?: string;
  /** Decoded hints from listing URL path or query. */
  urlText?: string;
}

interface BrandRule {
  canonical: string;
  patterns: RegExp[];
  categories: DealCategory[];
}

interface FamilyRule {
  canonical: string;
  pattern: RegExp;
  categories: DealCategory[];
  brandHint?: string;
}

const BRAND_RULES: BrandRule[] = [
  { canonical: "Apple", patterns: [/\bapple\b/i, /\biphone\b/i, /\bipad\b/i, /\bmacbook\b/i, /\bairpods\b/i], categories: ["Electronics"] },
  { canonical: "Samsung", patterns: [/\bsamsung\b/i, /\bgalaxy\b/i], categories: ["Electronics", "Appliances"] },
  { canonical: "Sony", patterns: [/\bsony\b/i, /\bplaystation\b/i], categories: ["Electronics"] },
  { canonical: "Nintendo", patterns: [/\bnintendo\b/i, /\bswitch\b/i], categories: ["Electronics", "Toys & Games"] },
  { canonical: "DeWalt", patterns: [/\bdewalt\b/i, /\bdee?walt\b/i], categories: ["Tools & Hardware"] },
  { canonical: "Milwaukee", patterns: [/\bmilwaukee\b/i, /\bm18\b/i, /\bm12\b/i], categories: ["Tools & Hardware"] },
  { canonical: "Makita", patterns: [/\bmakita\b/i], categories: ["Tools & Hardware"] },
  { canonical: "Bosch", patterns: [/\bbosch\b/i], categories: ["Tools & Hardware", "Appliances"] },
  { canonical: "Ridgid", patterns: [/\bridgid\b/i], categories: ["Tools & Hardware"] },
  { canonical: "Craftsman", patterns: [/\bcraftsman\b/i], categories: ["Tools & Hardware"] },
  { canonical: "Festool", patterns: [/\bfestool\b/i], categories: ["Tools & Hardware"] },
  { canonical: "Snap-on", patterns: [/\bsnap[- ]?on\b/i], categories: ["Tools & Hardware", "Vehicles & Parts"] },
  { canonical: "KitchenAid", patterns: [/\bkitchenaid\b/i], categories: ["Appliances"] },
  { canonical: "Whirlpool", patterns: [/\bwhirlpool\b/i], categories: ["Appliances"] },
  { canonical: "LG", patterns: [/\blg\b/i], categories: ["Electronics", "Appliances"] },
  { canonical: "Dyson", patterns: [/\bdyson\b/i], categories: ["Appliances", "Electronics"] },
  { canonical: "Vitamix", patterns: [/\bvitamix\b/i], categories: ["Appliances"] },
  { canonical: "Honda", patterns: [/\bhonda\b/i], categories: ["Vehicles & Parts"] },
  { canonical: "Toyota", patterns: [/\btoyota\b/i], categories: ["Vehicles & Parts"] },
  { canonical: "Ford", patterns: [/\bford\b/i], categories: ["Vehicles & Parts"] },
  { canonical: "Chevrolet", patterns: [/\bchev(?:y|rolet)\b/i], categories: ["Vehicles & Parts"] },
  { canonical: "Harley-Davidson", patterns: [/\bharley[- ]?davidson\b/i, /\bharley\b/i], categories: ["Vehicles & Parts"] },
  { canonical: "West Elm", patterns: [/\bwest\s*elm\b/i], categories: ["Furniture"] },
  { canonical: "IKEA", patterns: [/\bikea\b/i], categories: ["Furniture"] },
  { canonical: "Herman Miller", patterns: [/\bherman\s*miller\b/i], categories: ["Furniture"] },
  { canonical: "Restoration Hardware", patterns: [/\brestoration\s*hardware\b/i, /\brh\b/i], categories: ["Furniture"] },
  { canonical: "Pokemon", patterns: [/\bpokemon\b/i, /\bpokémon\b/i], categories: ["Collectibles & Antiques", "Toys & Games"] },
  { canonical: "Topps", patterns: [/\btopps\b/i], categories: ["Collectibles & Antiques"] },
  { canonical: "Nike", patterns: [/\bnike\b/i, /\bjordan\b/i, /\bair\s*jordan\b/i], categories: ["Clothing & Accessories", "Sports & Outdoors"] },
  { canonical: "Adidas", patterns: [/\badidas\b/i, /\byeezy\b/i], categories: ["Clothing & Accessories"] },
  { canonical: "Patagonia", patterns: [/\bpatagonia\b/i], categories: ["Clothing & Accessories"] },
  { canonical: "The North Face", patterns: [/\bnorth\s*face\b/i, /\btnf\b/i], categories: ["Clothing & Accessories"] },
  { canonical: "Arc'teryx", patterns: [/\barc'?teryx\b/i], categories: ["Clothing & Accessories"] },
  { canonical: "Canon", patterns: [/\bcanon\b/i], categories: ["Electronics"] },
  { canonical: "Nikon", patterns: [/\bnikon\b/i], categories: ["Electronics"] },
  { canonical: "Bose", patterns: [/\bbose\b/i], categories: ["Electronics"] },
  { canonical: "HP", patterns: [/\bhp\b/i, /\bhewlett\b/i], categories: ["Electronics"] },
  { canonical: "Dell", patterns: [/\bdell\b/i], categories: ["Electronics"] },
  { canonical: "Lenovo", patterns: [/\blenovo\b/i, /\bthinkpad\b/i], categories: ["Electronics"] },
  { canonical: "Microsoft", patterns: [/\bmicrosoft\b/i, /\bxbox\b/i], categories: ["Electronics"] },
  { canonical: "Google", patterns: [/\bgoogle\b/i, /\bpixel\b/i], categories: ["Electronics"] },
  { canonical: "Weber", patterns: [/\bweber\b/i], categories: ["Home & Garden", "Appliances"] },
  { canonical: "Yeti", patterns: [/\byeti\b/i], categories: ["Home & Garden", "Sports & Outdoors"] },
  { canonical: "Le Creuset", patterns: [/\ble\s*creuset\b/i], categories: ["Appliances", "Home & Garden"] },
];

const FAMILY_RULES: FamilyRule[] = [
  { canonical: "iPhone", pattern: /\biphone\b/i, categories: ["Electronics"], brandHint: "Apple" },
  { canonical: "iPad", pattern: /\bipad\b/i, categories: ["Electronics"], brandHint: "Apple" },
  { canonical: "MacBook", pattern: /\bmacbook\b/i, categories: ["Electronics"], brandHint: "Apple" },
  { canonical: "AirPods", pattern: /\bairpods\b/i, categories: ["Electronics"], brandHint: "Apple" },
  { canonical: "Galaxy", pattern: /\bgalaxy\s*(s|a|z|note)?\s*\d*/i, categories: ["Electronics"], brandHint: "Samsung" },
  { canonical: "PlayStation", pattern: /\bplaystation\s*\d*/i, categories: ["Electronics"], brandHint: "Sony" },
  { canonical: "Xbox", pattern: /\bxbox\s*(series\s*[xs]|one)?/i, categories: ["Electronics"], brandHint: "Microsoft" },
  { canonical: "Switch", pattern: /\bnintendo\s*switch\b|\bswitch\s*oled\b/i, categories: ["Electronics", "Toys & Games"], brandHint: "Nintendo" },
  { canonical: "M18 Fuel", pattern: /\bm18\s*fuel\b/i, categories: ["Tools & Hardware"], brandHint: "Milwaukee" },
  { canonical: "M18", pattern: /\bm18\b/i, categories: ["Tools & Hardware"], brandHint: "Milwaukee" },
  { canonical: "M12", pattern: /\bm12\b/i, categories: ["Tools & Hardware"], brandHint: "Milwaukee" },
  { canonical: "XR", pattern: /\bxr\b/i, categories: ["Tools & Hardware"], brandHint: "DeWalt" },
  { canonical: "FlexVolt", pattern: /\bflexvolt\b/i, categories: ["Tools & Hardware"], brandHint: "DeWalt" },
  { canonical: "20V Max", pattern: /\b20v\s*max\b/i, categories: ["Tools & Hardware"], brandHint: "DeWalt" },
  { canonical: "18V LXT", pattern: /\b18v\s*lxt\b/i, categories: ["Tools & Hardware"], brandHint: "Makita" },
  { canonical: "Civic", pattern: /\bcivic\b/i, categories: ["Vehicles & Parts"], brandHint: "Honda" },
  { canonical: "Accord", pattern: /\baccord\b/i, categories: ["Vehicles & Parts"], brandHint: "Honda" },
  { canonical: "F-150", pattern: /\bf[- ]?150\b/i, categories: ["Vehicles & Parts"], brandHint: "Ford" },
  { canonical: "Camry", pattern: /\bcamry\b/i, categories: ["Vehicles & Parts"], brandHint: "Toyota" },
  { canonical: "Kallax", pattern: /\bkallax\b/i, categories: ["Furniture"], brandHint: "IKEA" },
  { canonical: "Eames", pattern: /\beames\b/i, categories: ["Furniture"] },
  { canonical: "Charizard", pattern: /\bcharizard\b/i, categories: ["Collectibles & Antiques", "Toys & Games"], brandHint: "Pokemon" },
];

const MODEL_PATTERNS: { pattern: RegExp; categories: DealCategory[] }[] = [
  { pattern: /\biphone\s*(?:se\s*)?(1[0-7]|\d{1,2})(?:\s*(pro\s*max|pro|plus|mini))?/i, categories: ["Electronics"] },
  { pattern: /\bgalaxy\s*(s|a|z|note)\s*(\d{1,2})(?:\s*(?:ultra|\+|fe))?/i, categories: ["Electronics"] },
  { pattern: /\bmacbook\s*(air|pro)?\s*(m[1-4])?(?:\s*(1[3-6]|\d{2}))?/i, categories: ["Electronics"] },
  { pattern: /\bplaystation\s*([45])\b/i, categories: ["Electronics"] },
  { pattern: /\bxbox\s*series\s*([xs])\b/i, categories: ["Electronics"] },
  { pattern: /\b(dcd|dcf|dewalt|dc)\s*[a-z]?\d{3,}[a-z0-9-]*/i, categories: ["Tools & Hardware"] },
  { pattern: /\b\d{4}\s+(?:honda|toyota|ford|chevy|chevrolet|nissan|bmw|mercedes)\s+[a-z0-9-]+/i, categories: ["Vehicles & Parts"] },
  { pattern: /\b(?:honda|toyota|ford|chevy|chevrolet)\s+[a-z0-9-]+\s+(?:19|20)\d{2}\b/i, categories: ["Vehicles & Parts"] },
  { pattern: /\b(?:19|20)\d{2}\s+(?:honda|toyota|ford|chevy|chevrolet|nissan)\s+[a-z0-9-]+/i, categories: ["Vehicles & Parts"] },
  { pattern: /\bmodel\s*#?\s*[a-z]{0,3}\d{3,}[a-z0-9-]*/i, categories: ["Tools & Hardware", "Appliances", "Electronics"] },
  { pattern: /\b[A-Z]{1,3}\d{3,}[A-Z0-9-]{2,}\b/, categories: ["Appliances", "Electronics", "Tools & Hardware"] },
  { pattern: /\b(wtw|wtg|wfw|whd)\d{4,}\w*/i, categories: ["Appliances"] },
];

const VARIANT_PATTERNS: { pattern: RegExp; label: (match: RegExpMatchArray) => string }[] = [
  { pattern: /\b(psa|cgc|bgs|sgc)\s*(\d+(?:\.\d+)?)/i, label: (m) => `${m[1].toUpperCase()} ${m[2]}` },
  { pattern: /\b(\d{2,4})\s*gb\b/i, label: (m) => `${m[1]}GB` },
  { pattern: /\b(\d)\s*tb\b/i, label: (m) => `${m[1]}TB` },
  { pattern: /\b(fuel|brushless|cordless|bare\s*tool|combo\s*kit)\b/i, label: (m) => m[1].replace(/\s+/g, " ") },
  { pattern: /\b(ex|lx|sport|touring|limited|platinum|xlt|ltz|ss|rs|gt|sti|wrx)\b/i, label: (m) => m[1].toUpperCase() },
  { pattern: /\b(pro\s*max|pro|plus|mini|ultra|se)\b/i, label: (m) => m[1].replace(/\s+/g, " ") },
];

const SUPPORTED_CATEGORIES: DealCategory[] = [
  "Electronics",
  "Tools & Hardware",
  "Appliances",
  "Vehicles & Parts",
  "Furniture",
  "Collectibles & Antiques",
  "Clothing & Accessories",
];

export function isIdentitySupportedCategory(category: DealCategory): boolean {
  return SUPPORTED_CATEGORIES.includes(category);
}

export function extractUrlIdentityHints(listingUrl: string | null): string {
  if (!listingUrl) return "";

  try {
    const url = new URL(listingUrl);
    const parts = [
      url.hostname,
      decodeURIComponent(url.pathname.replace(/\//g, " ")),
      decodeURIComponent(url.search.replace(/[?&=]/g, " ")),
    ];
    return parts.join(" ").toLowerCase();
  } catch {
    return listingUrl.toLowerCase();
  }
}

export function buildIdentityHaystack(
  input: DealInput,
  comps?: ComparableSale[],
  extra?: ItemIdentitySources
): { haystack: string; sources: string[] } {
  const buckets: { key: string; text: string }[] = [
    { key: "itemName", text: input.itemName },
    { key: "notes", text: input.notes },
  ];

  if (extra?.listingText?.trim()) {
    buckets.push({ key: "listingText", text: extra.listingText });
  }
  if (extra?.ocrText?.trim()) {
    buckets.push({ key: "ocrText", text: extra.ocrText });
  }

  const urlHints = extra?.urlText ?? extractUrlIdentityHints(input.listingUrl);
  if (urlHints.trim()) {
    buckets.push({ key: "urlText", text: urlHints });
  }

  for (const comp of comps ?? []) {
    buckets.push({ key: "comps", text: `${comp.title} ${comp.notes}` });
  }

  const sources = buckets
    .filter((bucket) => bucket.text.trim().length > 0)
    .map((bucket) => bucket.key);

  const haystack = buckets
    .map((bucket) => bucket.text)
    .join(" ")
    .toLowerCase();

  return { haystack, sources: [...new Set(sources)] };
}

function categoryMatches(
  ruleCategories: DealCategory[],
  category: DealCategory
): boolean {
  return ruleCategories.includes(category) || !isIdentitySupportedCategory(category);
}

function detectBrand(
  haystack: string,
  category: DealCategory
): string | null {
  for (const rule of BRAND_RULES) {
    if (!categoryMatches(rule.categories, category)) continue;
    if (rule.patterns.some((pattern) => pattern.test(haystack))) {
      return rule.canonical;
    }
  }
  return null;
}

function detectProductFamily(
  haystack: string,
  category: DealCategory,
  brand: string | null
): string | null {
  for (const rule of FAMILY_RULES) {
    if (!categoryMatches(rule.categories, category)) continue;
    if (rule.pattern.test(haystack)) {
      if (rule.brandHint && brand && rule.brandHint !== brand) continue;
      return rule.canonical;
    }
  }
  return null;
}

function detectModel(haystack: string, category: DealCategory): string | null {
  for (const rule of MODEL_PATTERNS) {
    if (!categoryMatches(rule.categories, category)) continue;
    const match = haystack.match(rule.pattern);
    if (match) {
      return match[0].trim().replace(/\s+/g, " ");
    }
  }
  return null;
}

function detectVariant(haystack: string): string | null {
  for (const rule of VARIANT_PATTERNS) {
    const match = haystack.match(rule.pattern);
    if (match) return rule.label(match);
  }
  return null;
}

function scoreIdentityConfidence(
  brand: string | null,
  model: string | null,
  productFamily: string | null,
  variant: string | null,
  sourceCount: number,
  category: DealCategory
): IdentityConfidence {
  let score = 0;

  if (brand) score += 2;
  if (model) score += 3;
  if (productFamily) score += 2;
  if (variant) score += 1;
  if (sourceCount >= 3) score += 1;
  if (sourceCount >= 2 && brand) score += 1;

  if (
    category === "Collectibles & Antiques" &&
    variant &&
    /\b(psa|cgc|bgs|sgc)/i.test(variant)
  ) {
    score += 2;
  }

  if (brand && model) return score >= 4 ? "high" : "medium";
  if (brand && productFamily) return score >= 4 ? "high" : "medium";
  if (model || productFamily) return "medium";
  if (brand) return "low";
  return "low";
}

function buildDisplayLabel(
  brand: string | null,
  model: string | null,
  productFamily: string | null,
  variant: string | null
): string {
  const parts: string[] = [];

  if (brand) parts.push(brand);
  if (productFamily && productFamily !== brand) parts.push(productFamily);
  if (model && !parts.join(" ").toLowerCase().includes(model.toLowerCase())) {
    parts.push(model);
  }
  if (variant) parts.push(`(${variant})`);

  if (parts.length === 0) return "Unknown product";
  return parts.join(" ");
}

export function getItemIdentityFromText(
  text: string,
  category: DealCategory
): ItemIdentity {
  const haystack = text.toLowerCase();
  if (!haystack.trim()) return { ...EMPTY_ITEM_IDENTITY };

  const brand = detectBrand(haystack, category);
  const productFamily = detectProductFamily(haystack, category, brand);
  const model = detectModel(haystack, category);
  const variant = detectVariant(haystack);
  const confidence = scoreIdentityConfidence(
    brand,
    model,
    productFamily,
    variant,
    1,
    category
  );

  return {
    brand,
    model,
    productFamily,
    variant,
    confidence,
    displayLabel: buildDisplayLabel(brand, model, productFamily, variant),
    sources: ["text"],
  };
}

export function getItemIdentity(
  input: DealInput,
  comps?: ComparableSale[],
  extra?: ItemIdentitySources
): ItemIdentity {
  if (!isIdentitySupportedCategory(input.category)) {
    return { ...EMPTY_ITEM_IDENTITY, sources: [] };
  }

  const { haystack, sources } = buildIdentityHaystack(input, comps, extra);

  if (!haystack.trim()) {
    return { ...EMPTY_ITEM_IDENTITY, sources: [] };
  }

  const brand = detectBrand(haystack, input.category);
  const productFamily = detectProductFamily(haystack, input.category, brand);
  const model = detectModel(haystack, input.category);
  const variant = detectVariant(haystack);
  const confidence = scoreIdentityConfidence(
    brand,
    model,
    productFamily,
    variant,
    sources.length,
    input.category
  );

  return {
    brand,
    model,
    productFamily,
    variant,
    confidence,
    displayLabel: buildDisplayLabel(brand, model, productFamily, variant),
    sources,
  };
}

/** Bump estimate confidence one step when identity is strong. */
export function upgradeEstimateConfidenceFromIdentity(
  confidence: "low" | "medium" | "high",
  identity: ItemIdentity
): "low" | "medium" | "high" {
  if (identity.confidence !== "high") return confidence;
  if (confidence === "low") return "medium";
  if (confidence === "medium") return "high";
  return confidence;
}

/** Risk reduction when product identity is well known. */
export function getIdentityRiskAdjustment(identity: ItemIdentity): number {
  if (identity.confidence === "high") return -0.5;
  if (identity.confidence === "medium" && identity.brand) return -0.25;
  return 0;
}

export function buildIdentityVerdictNotes(identity: ItemIdentity): string[] {
  if (!identity.brand && !identity.model && !identity.productFamily) {
    return [];
  }

  const notes: string[] = [];

  if (identity.confidence === "high") {
    notes.push(
      `Identified product: ${identity.displayLabel} — easier to comp and price.`
    );
  } else if (identity.brand) {
    notes.push(
      `Partial identity: ${identity.displayLabel} — confirm exact model before buying.`
    );
  }

  return notes;
}

export function buildIdentityHaggleNotes(identity: ItemIdentity): string[] {
  if (identity.confidence !== "high" && identity.confidence !== "medium") {
    return [];
  }

  const notes: string[] = [];

  if (identity.model) {
    notes.push(
      `Reference sold comps for ${identity.displayLabel} when countering.`
    );
  } else if (identity.brand) {
    notes.push(
      `Use ${identity.brand} sold listings in the same family to justify your offer.`
    );
  }

  if (identity.variant && /\b(psa|cgc|bgs|sgc)/i.test(identity.variant)) {
    notes.push("Grade-specific comps matter — do not mix raw and graded prices.");
  }

  return notes;
}

export function buildIdentityCategoryBoosters(
  identity: ItemIdentity
): { label: string; message: string }[] {
  if (!identity.brand && !identity.productFamily) return [];

  const boosters: { label: string; message: string }[] = [];

  if (identity.confidence === "high") {
    boosters.push({
      label: "Known product identity",
      message: `${identity.displayLabel} is identifiable — verify comps match this exact variant.`,
    });
  }

  if (identity.variant && /\b(fuel|brushless|m18|xr|flexvolt)/i.test(identity.variant)) {
    boosters.push({
      label: "Pro variant",
      message: `${identity.variant} tier often commands stronger resale in tools.`,
    });
  }

  return boosters;
}
