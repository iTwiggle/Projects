import {
  parseListingWithConfidence,
  type FieldConfidence,
} from "@/lib/intake/listing-parser";
import type { CompListingType } from "@/lib/types/comps";
import type { DealCondition } from "@/lib/types/deal";

export interface ParsedCompConfidence {
  title: FieldConfidence;
  price: FieldConfidence;
  condition: FieldConfidence;
  listingType: FieldConfidence;
  platform: FieldConfidence;
}

export interface ParsedCompDraft {
  draftId: string;
  title: string;
  price: number;
  condition: DealCondition;
  notes: string;
  platform: string;
  listingType: CompListingType;
  confidence: ParsedCompConfidence;
}

const SOLD_HINTS =
  /\b(sold|ended|completed|winning bid|final price|hammer price|auction ended|item sold|sale price)\b/i;
const LISTED_HINTS =
  /\b(asking|for sale|listed|available|obo|or best offer|buy it now|active listing)\b/i;

const PLATFORM_RULES: { platform: string; pattern: RegExp }[] = [
  { platform: "eBay", pattern: /\bebay\b/i },
  { platform: "Facebook Marketplace", pattern: /\b(facebook|marketplace|fb marketplace)\b/i },
  { platform: "Craigslist", pattern: /\bcraigslist\b/i },
  { platform: "OfferUp", pattern: /\bofferup\b/i },
  { platform: "Mercari", pattern: /\bmercari\b/i },
  { platform: "Poshmark", pattern: /\bposhmark\b/i },
  { platform: "Grailed", pattern: /\bgrailed\b/i },
];

let draftCounter = 0;

export function generateCompDraftId(): string {
  draftCounter += 1;
  return `comp-draft-${Date.now()}-${draftCounter}`;
}

export function splitCompTextBlocks(text: string): string[] {
  return text
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export function detectCompListingType(
  text: string
): { listingType: CompListingType; confidence: FieldConfidence } {
  const sold = SOLD_HINTS.test(text);
  const listed = LISTED_HINTS.test(text);

  if (sold && !listed) {
    return { listingType: "sold", confidence: "high" };
  }
  if (listed && !sold) {
    return { listingType: "listed", confidence: "high" };
  }
  if (sold && listed) {
    return { listingType: "sold", confidence: "medium" };
  }

  return { listingType: "sold", confidence: "low" };
}

export function detectCompPlatform(
  text: string
): { platform: string; confidence: FieldConfidence } {
  for (const rule of PLATFORM_RULES) {
    if (rule.pattern.test(text)) {
      return { platform: rule.platform, confidence: "high" };
    }
  }

  if (/\bauction\b/i.test(text)) {
    return { platform: "eBay", confidence: "medium" };
  }

  return { platform: "Other", confidence: "low" };
}

export function isValidCompDraft(draft: ParsedCompDraft): boolean {
  return draft.title.trim().length > 0 && draft.price > 0;
}

export function parseCompTextBlock(block: string): ParsedCompDraft | null {
  const trimmed = block.trim();
  if (!trimmed) return null;

  const parsed = parseListingWithConfidence(trimmed);
  const listingTypeResult = detectCompListingType(trimmed);
  const platformResult = detectCompPlatform(trimmed);

  const title = parsed.fields.itemName.trim() || "Untitled comp";
  const price = parsed.fields.askingPrice;

  if (!title && price <= 0) return null;

  return {
    draftId: generateCompDraftId(),
    title,
    price,
    condition: parsed.fields.condition,
    notes: parsed.fields.notes,
    platform: platformResult.platform,
    listingType: listingTypeResult.listingType,
    confidence: {
      title: parsed.confidence.itemName,
      price: parsed.confidence.askingPrice,
      condition: parsed.confidence.condition,
      listingType: listingTypeResult.confidence,
      platform: platformResult.confidence,
    },
  };
}

export function parseCompTextBatch(text: string): ParsedCompDraft[] {
  return splitCompTextBlocks(text)
    .map(parseCompTextBlock)
    .filter((draft): draft is ParsedCompDraft => draft !== null);
}

export function parsedCompDraftToComparable(
  draft: ParsedCompDraft,
  id: string
): import("@/lib/types/comps").ComparableSale {
  return {
    id,
    title: draft.title.trim(),
    platform: draft.platform,
    price: draft.price,
    condition: draft.condition,
    notes: draft.notes.trim(),
    listingType: draft.listingType,
  };
}
