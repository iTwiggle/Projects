import type { DealCategory, DealCondition } from "@/lib/types/deal";

export interface ExtractedListingFields {
  itemName: string;
  askingPrice: number;
  condition: DealCondition;
  category: DealCategory;
  notes: string;
}

export type FieldConfidence = "high" | "medium" | "low";

export interface ExtractionConfidence {
  itemName: FieldConfidence;
  askingPrice: FieldConfidence;
  condition: FieldConfidence;
  category: FieldConfidence;
}

export interface ParsedListingResult {
  fields: ExtractedListingFields;
  confidence: ExtractionConfidence;
}

export const DEFAULT_EXTRACTED: ExtractedListingFields = {
  itemName: "",
  askingPrice: 0,
  condition: "Good",
  category: "Other",
  notes: "",
};

export const DEFAULT_CONFIDENCE: ExtractionConfidence = {
  itemName: "low",
  askingPrice: "low",
  condition: "low",
  category: "low",
};

const PRICE_PATTERNS: { pattern: RegExp; confidence: FieldConfidence }[] = [
  { pattern: /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:obo|or best offer)?/i, confidence: "high" },
  { pattern: /(?:asking|price|listed|sell(?:ing)?)\s+(?:for|at)?\s*:?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i, confidence: "high" },
  { pattern: /\b([\d,]+(?:\.\d{2})?)\s*(?:USD|usd)\b/i, confidence: "high" },
  { pattern: /\b([\d,]+(?:\.\d{2})?)\s+firm\b/i, confidence: "medium" },
  { pattern: /\b([\d,]+(?:\.\d{2})?)\s+cash\b/i, confidence: "medium" },
  { pattern: /\$\s*([\d,]+(?:\.\d{2})?)/, confidence: "high" },
];

const CONDITION_RULES: { pattern: RegExp; condition: DealCondition; confidence: FieldConfidence }[] = [
  { pattern: /\bbrand\s*new\b|\bnew\s+in\s+box\b|\bnib\b|\bsealed\b/i, condition: "New", confidence: "high" },
  { pattern: /\blike\s*new\b|\bopen\s*box\b|\blnib\b|\bexcellent\b/i, condition: "Like New", confidence: "high" },
  { pattern: /\bfair\s+condition\b/i, condition: "Fair", confidence: "high" },
  { pattern: /\bpoor\s+condition\b|\bfor\s+parts\b|\bnot\s+working\b|\bas-?is\b/i, condition: "Poor", confidence: "high" },
  { pattern: /\bgood\s+condition\b|\bgently\s+used\b/i, condition: "Good", confidence: "high" },
  { pattern: /\bfair\b/i, condition: "Fair", confidence: "medium" },
  { pattern: /\bused\b/i, condition: "Good", confidence: "medium" },
];

const TITLE_STRIP_PATTERNS = [
  /\s*[-–|•·]\s*(brand\s*new|like\s*new|good|fair|poor|used|excellent)(\s+condition)?\b/gi,
  /\s*\(\s*(new|used|like\s*new|good|fair|poor|excellent)\s*\)/gi,
  /\s*[,;]\s*(good|fair|poor|used|like\s*new)\s*$/gi,
];

const CATEGORY_HINTS: { category: DealCategory; keywords: string[] }[] = [
  {
    category: "Electronics",
    keywords: [
      "iphone", "ipad", "macbook", "laptop", "computer", "tv", "television",
      "monitor", "camera", "playstation", "xbox", "nintendo", "switch",
      "tablet", "speaker", "headphones", "airpods", "samsung", "gpu", "router",
    ],
  },
  {
    category: "Furniture",
    keywords: [
      "couch", "sofa", "dresser", "table", "chair", "desk", "bed", "mattress",
      "bookshelf", "cabinet", "sectional",
    ],
  },
  {
    category: "Vehicles & Parts",
    keywords: [
      "car", "truck", "motorcycle", "bike", "tire", "rim", "engine",
      "transmission", "honda", "toyota", "ford", "harley",
    ],
  },
  {
    category: "Clothing & Accessories",
    keywords: [
      "shirt", "jacket", "shoes", "sneakers", "purse", "handbag", "watch",
      "jeans", "coat", "nike", "adidas", "patagonia",
    ],
  },
  {
    category: "Collectibles & Antiques",
    keywords: [
      "vintage", "antique", "collectible", "rare", "coin", "comic",
      "trading card", "pokemon", "memorabilia",
    ],
  },
  {
    category: "Tools & Hardware",
    keywords: [
      "drill", "saw", "wrench", "tool", "dewalt", "makita", "milwaukee",
      "craftsman", "ladder", "compressor",
    ],
  },
  {
    category: "Home & Garden",
    keywords: [
      "planter", "grill", "lawn", "mower", "vacuum", "le creuset", "kitchen",
      "dutch oven", "patio", "garden",
    ],
  },
  {
    category: "Sports & Outdoors",
    keywords: [
      "kayak", "golf", "fishing", "camping", "tent", "bicycle", "weights",
      "fitness", "ski", "snowboard",
    ],
  },
  {
    category: "Toys & Games",
    keywords: ["lego", "toy", "game", "board game", "doll", "action figure"],
  },
  {
    category: "Books & Media",
    keywords: ["book", "textbook", "vinyl", "record", "dvd", "blu-ray", "cd"],
  },
  {
    category: "Appliances",
    keywords: [
      "refrigerator", "fridge", "washer", "dryer", "dishwasher", "microwave",
      "oven", "freezer", "appliance",
    ],
  },
];

const SKIP_TITLE_LINE =
  /^(listed|posted|seller|location|pickup|message|share|marketplace|facebook|offerup|craigslist|free)\b/i;

interface PriceParseResult {
  value: number;
  confidence: FieldConfidence;
  isFree: boolean;
}

function parsePrice(text: string): PriceParseResult {
  if (/\bfree\b/i.test(text)) {
    return { value: 0, confidence: "high", isFree: true };
  }

  for (const { pattern, confidence } of PRICE_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = parseFloat(match[1].replace(/,/g, ""));
      if (!Number.isNaN(value) && value > 0) {
        return { value, confidence, isFree: false };
      }
    }
  }

  return { value: 0, confidence: "low", isFree: false };
}

function parseCondition(text: string): { condition: DealCondition; confidence: FieldConfidence } {
  for (const rule of CONDITION_RULES) {
    if (rule.pattern.test(text)) {
      return { condition: rule.condition, confidence: rule.confidence };
    }
  }
  return { condition: "Good", confidence: "low" };
}

function parseCategory(text: string): { category: DealCategory; confidence: FieldConfidence; score: number } {
  const lower = text.toLowerCase();
  let best: DealCategory = "Other";
  let bestScore = 0;

  for (const { category, keywords } of CATEGORY_HINTS) {
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }

  const confidence: FieldConfidence =
    bestScore >= 2 ? "high" : bestScore === 1 ? "medium" : "low";

  return { category: best, confidence, score: bestScore };
}

function isPriceLine(line: string): boolean {
  if (/\bfree\b/i.test(line)) return true;
  return PRICE_PATTERNS.some(({ pattern }) => pattern.test(line));
}

function stripConditionFromTitle(title: string): string {
  let result = title;
  for (const pattern of TITLE_STRIP_PATTERNS) {
    result = result.replace(pattern, "");
  }
  return result.replace(/\s{2,}/g, " ").trim();
}

function cleanTitle(line: string): string {
  return stripConditionFromTitle(
    line
      .replace(/^\d+[.)]\s*/, "")
      .replace(/\s*[-–|•]\s*Facebook.*$/i, "")
      .replace(/\s*[-–|•]\s*Marketplace.*$/i, "")
      .replace(/\s*[-–|•]\s*OfferUp.*$/i, "")
      .replace(/\s*[-–|•]\s*Craigslist.*$/i, "")
      .trim()
  );
}

function parseTitle(lines: string[]): { title: string; confidence: FieldConfidence } {
  for (const line of lines) {
    const cleaned = cleanTitle(line);
    if (cleaned.length < 3) continue;
    if (isPriceLine(cleaned) && cleaned.length < 24) continue;
    if (SKIP_TITLE_LINE.test(cleaned)) continue;
    if (/^pickup\s+only\b/i.test(cleaned)) continue;

    const confidence: FieldConfidence =
      cleaned.length >= 8 ? "high" : cleaned.length >= 4 ? "medium" : "low";

    return { title: cleaned.slice(0, 120), confidence };
  }
  return { title: "", confidence: "low" };
}

function buildNotes(lines: string[], title: string, priceLineIndexes: Set<number>): string {
  const noteLines = lines.filter((line, index) => {
    const cleaned = line.trim();
    if (!cleaned) return false;
    if (priceLineIndexes.has(index)) return false;
    if (cleanTitle(cleaned) === title) return false;
    if (/^(facebook|marketplace|offerup|craigslist)\b/i.test(cleaned)) {
      return false;
    }
    return true;
  });

  return noteLines.join("\n").trim().slice(0, 500);
}

export function parseListingWithConfidence(text: string): ParsedListingResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { fields: { ...DEFAULT_EXTRACTED }, confidence: { ...DEFAULT_CONFIDENCE } };
  }

  const lines = trimmed
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const priceResult = parsePrice(trimmed);
  const conditionResult = parseCondition(trimmed);
  const categoryResult = parseCategory(trimmed);
  const titleResult = parseTitle(lines);

  const priceLineIndexes = new Set<number>();
  lines.forEach((line, index) => {
    if (isPriceLine(line)) priceLineIndexes.add(index);
  });

  const notes = buildNotes(lines, titleResult.title, priceLineIndexes);

  return {
    fields: {
      itemName: titleResult.title,
      askingPrice: priceResult.value,
      condition: conditionResult.condition,
      category: categoryResult.category,
      notes,
    },
    confidence: {
      itemName: titleResult.confidence,
      askingPrice: priceResult.isFree ? "high" : priceResult.confidence,
      condition: conditionResult.confidence,
      category: categoryResult.confidence,
    },
  };
}

/** @deprecated Use parseListingWithConfidence for confidence scores. */
export function parseListingText(text: string): ExtractedListingFields {
  return parseListingWithConfidence(text).fields;
}

export function extractedToDealPartial(
  extracted: ExtractedListingFields
): Partial<import("@/lib/types/deal").DealInput> {
  return {
    itemName: extracted.itemName,
    askingPrice: extracted.askingPrice,
    condition: extracted.condition,
    category: extracted.category,
    notes: extracted.notes,
    knownResaleValue: null,
  };
}

export function isExtractedEmpty(extracted: ExtractedListingFields): boolean {
  return (
    !extracted.itemName &&
    extracted.askingPrice <= 0 &&
    !extracted.notes
  );
}

export const PREFILLABLE_FIELDS = [
  "itemName",
  "askingPrice",
  "condition",
  "category",
  "notes",
] as const;

export type PrefillableField = (typeof PREFILLABLE_FIELDS)[number];

export function getFieldLabel(field: PrefillableField): string {
  const labels: Record<PrefillableField, string> = {
    itemName: "Item Name",
    askingPrice: "Asking Price",
    condition: "Condition",
    category: "Category",
    notes: "Notes",
  };
  return labels[field];
}

export function isFieldFilled(
  input: import("@/lib/types/deal").DealInput,
  field: PrefillableField,
  touchedFields: Set<PrefillableField> = new Set()
): boolean {
  if (touchedFields.has(field)) return true;

  switch (field) {
    case "itemName":
      return input.itemName.trim().length > 0;
    case "askingPrice":
      return input.askingPrice > 0;
    case "condition":
      return false;
    case "category":
      return false;
    case "notes":
      return input.notes.trim().length > 0;
  }
}

export function getProposedValue(
  proposed: Partial<import("@/lib/types/deal").DealInput>,
  field: PrefillableField
): string {
  const value = proposed[field];
  if (value === undefined || value === null) return "—";
  if (field === "askingPrice") return `$${value}`;
  return String(value);
}

export function getCurrentValue(
  input: import("@/lib/types/deal").DealInput,
  field: PrefillableField
): string {
  switch (field) {
    case "itemName":
      return input.itemName || "—";
    case "askingPrice":
      return input.askingPrice > 0 ? `$${input.askingPrice}` : "—";
    case "condition":
      return input.condition;
    case "category":
      return input.category;
    case "notes":
      return input.notes || "—";
  }
}

export function mergePrefill(
  current: import("@/lib/types/deal").DealInput,
  proposed: Partial<import("@/lib/types/deal").DealInput>,
  overwriteFields: Set<PrefillableField>,
  touchedFields: Set<PrefillableField> = new Set()
): import("@/lib/types/deal").DealInput {
  const merged = { ...current, knownResaleValue: current.knownResaleValue };

  for (const field of PREFILLABLE_FIELDS) {
    const proposedValue = proposed[field];
    if (proposedValue === undefined) continue;

    const hasConflict =
      isFieldFilled(current, field, touchedFields) &&
      String(proposedValue) !== String(current[field as keyof typeof current]);

    if (!hasConflict || overwriteFields.has(field)) {
      if (field === "itemName" && typeof proposedValue === "string" && proposedValue) {
        merged.itemName = proposedValue;
      } else if (field === "askingPrice" && typeof proposedValue === "number" && proposedValue > 0) {
        merged.askingPrice = proposedValue;
      } else if (field === "condition") {
        merged.condition = proposedValue as DealCondition;
      } else if (field === "category") {
        merged.category = proposedValue as DealCategory;
      } else if (field === "notes" && typeof proposedValue === "string" && proposedValue) {
        merged.notes = overwriteFields.has(field) || !current.notes.trim()
          ? proposedValue
          : `${current.notes}\n\n${proposedValue}`;
      }
    }
  }

  return merged;
}

export function getConflictingFields(
  current: import("@/lib/types/deal").DealInput,
  proposed: Partial<import("@/lib/types/deal").DealInput>,
  touchedFields: Set<PrefillableField> = new Set()
): PrefillableField[] {
  return PREFILLABLE_FIELDS.filter((field) => {
    const proposedValue = proposed[field];
    if (proposedValue === undefined) return false;
    if (field === "askingPrice" && (proposedValue as number) <= 0) return false;
    if (field === "itemName" && !(proposedValue as string).trim()) return false;
    if (field === "notes" && !(proposedValue as string).trim()) return false;
    return (
      isFieldFilled(current, field, touchedFields) &&
      String(proposedValue) !== String(current[field as keyof typeof current])
    );
  });
}
