import { detectCompPlatform } from "@/lib/intake/comp-text-parser";
import type {
  CapturedComp,
  CompCaptureBatch,
  CompImportReport,
  NormalizeCapturedCompsResult,
} from "@/lib/types/comp-capture";
import { COMP_CAPTURE_SCHEMA_VERSION } from "@/lib/types/comp-capture";
import {
  COMP_PLATFORMS,
  generateCompId,
  type ComparableSale,
  type CompListingType,
} from "@/lib/types/comps";
import { DEAL_CONDITIONS, type DealCondition } from "@/lib/types/deal";
import type { ItemIdentity } from "@/lib/types/item-identity";

const MAX_BATCH_SIZE = 50;
const MAX_TITLE_LENGTH = 200;
const MAX_PRICE = 1_000_000;
const MAX_RAW_TEXT_LENGTH = 2000;

const QUERY_STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "new",
  "used",
  "sale",
  "item",
  "lot",
]);

export interface NormalizeCapturedCompsOptions {
  existingComps?: ComparableSale[];
  itemIdentity?: ItemIdentity | null;
  compSearchQuery?: string | null;
  generateId?: () => string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export function compDedupeKey(comp: {
  platform: string;
  title: string;
  price: number;
}): string {
  return `${comp.platform.toLowerCase()}|${normalizeWhitespace(comp.title).toLowerCase()}|${comp.price}`;
}

export function normalizeCapturedPlatform(
  platform: string | undefined,
  batchPlatform?: string
): string {
  const raw = normalizeWhitespace(platform ?? batchPlatform ?? "");
  if (!raw) return "Other";

  const exact = COMP_PLATFORMS.find(
    (value) => value.toLowerCase() === raw.toLowerCase()
  );
  if (exact) return exact;

  const detected = detectCompPlatform(raw);
  if (detected.confidence !== "low") {
    return detected.platform;
  }

  const aliases: Record<string, string> = {
    ebay: "eBay",
    fb: "Facebook Marketplace",
    facebook: "Facebook Marketplace",
    marketplace: "Facebook Marketplace",
    craigslist: "Craigslist",
    offerup: "OfferUp",
    mercari: "Mercari",
    poshmark: "Poshmark",
    grailed: "Grailed",
  };

  const alias = aliases[raw.toLowerCase()];
  if (alias) return alias;

  return "Other";
}

export function normalizeCapturedListingType(listingType: unknown): CompListingType {
  if (listingType === "sold" || listingType === "listed") {
    return listingType;
  }
  return "listed";
}

export function normalizeCapturedCondition(
  condition: unknown
): DealCondition {
  if (typeof condition !== "string") return "Good";
  const trimmed = normalizeWhitespace(condition);
  const match = DEAL_CONDITIONS.find(
    (value) => value.toLowerCase() === trimmed.toLowerCase()
  );
  return match ?? "Good";
}

export function normalizeCapturedPrice(price: unknown): number | null {
  if (typeof price === "number" && Number.isFinite(price)) {
    const rounded = Math.round(price * 100) / 100;
    if (rounded > 0 && rounded <= MAX_PRICE) return rounded;
    return null;
  }
  if (typeof price === "string") {
    const parsed = parseFloat(price.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0 && parsed <= MAX_PRICE) {
      return Math.round(parsed * 100) / 100;
    }
  }
  return null;
}

function buildComparableNotes(captured: CapturedComp): string {
  const parts: string[] = [];
  if (captured.url?.trim()) {
    parts.push(`Source: ${captured.url.trim()}`);
  }
  if (captured.rawText?.trim()) {
    const excerpt = captured.rawText.trim().slice(0, MAX_RAW_TEXT_LENGTH);
    if (excerpt && !parts.some((part) => part.includes(excerpt))) {
      parts.push(excerpt);
    }
  }
  return parts.join("\n");
}

function significantQueryTokens(query: string): string[] {
  return normalizeWhitespace(query)
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9]/g, ""))
    .filter((token) => token.length >= 3 && !QUERY_STOP_WORDS.has(token));
}

export function getCompTitleMismatchWarnings(
  title: string,
  options: {
    itemIdentity?: ItemIdentity | null;
    compSearchQuery?: string | null;
  } = {}
): string[] {
  const normalizedTitle = title.toLowerCase();
  const warnings: string[] = [];

  const identity = options.itemIdentity;
  if (
    identity?.brand &&
    !identity.hasConflict &&
    (identity.confidence === "medium" || identity.confidence === "high")
  ) {
    const brand = identity.brand.toLowerCase();
    if (!normalizedTitle.includes(brand)) {
      warnings.push(
        `“${title}” does not mention detected brand ${identity.brand}.`
      );
    }
  }

  const query = options.compSearchQuery?.trim();
  if (query) {
    const tokens = significantQueryTokens(query);
    if (tokens.length >= 2) {
      const matchesQuery = tokens.some((token) => normalizedTitle.includes(token));
      if (!matchesQuery) {
        warnings.push(`“${title}” may not match comp search query “${query}”.`);
      }
    }
  }

  return warnings;
}

/** @deprecated Use getCompTitleMismatchWarnings */
export function getCompTitleMismatchWarning(
  title: string,
  options: {
    itemIdentity?: ItemIdentity | null;
    compSearchQuery?: string | null;
  } = {}
): string | null {
  const warnings = getCompTitleMismatchWarnings(title, options);
  return warnings[0] ?? null;
}

function validateCapturedComp(
  captured: unknown,
  index: number
): { comp: CapturedComp | null; warning: string | null } {
  if (!isRecord(captured)) {
    return {
      comp: null,
      warning: `Comp #${index + 1}: invalid entry (expected object).`,
    };
  }

  const title = typeof captured.title === "string" ? normalizeWhitespace(captured.title) : "";
  if (!title || title.length > MAX_TITLE_LENGTH) {
    return {
      comp: null,
      warning: `Comp #${index + 1}: missing or invalid title.`,
    };
  }

  const price = normalizeCapturedPrice(captured.price);
  if (price === null) {
    return {
      comp: null,
      warning: `Comp #${index + 1}: invalid price.`,
    };
  }

  const listingType = normalizeCapturedListingType(captured.listingType);

  const url =
    typeof captured.url === "string" && /^https?:\/\//i.test(captured.url.trim())
      ? captured.url.trim()
      : undefined;

  const imageUrl =
    typeof captured.imageUrl === "string" &&
    /^https?:\/\//i.test(captured.imageUrl.trim())
      ? captured.imageUrl.trim()
      : undefined;

  return {
    comp: {
      title,
      price,
      platform:
        typeof captured.platform === "string" ? captured.platform : "Other",
      listingType,
      condition:
        typeof captured.condition === "string" ? captured.condition : undefined,
      url,
      imageUrl,
      capturedAt:
        typeof captured.capturedAt === "string" ? captured.capturedAt : undefined,
      rawText:
        typeof captured.rawText === "string"
          ? captured.rawText.slice(0, MAX_RAW_TEXT_LENGTH)
          : undefined,
      confidence: isRecord(captured.confidence)
        ? (captured.confidence as CapturedComp["confidence"])
        : undefined,
    },
    warning: null,
  };
}

export function isCompCaptureBatch(value: unknown): value is CompCaptureBatch {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.comps)) return false;
  if (typeof value.schemaVersion !== "string") return false;
  if (typeof value.source !== "string") return false;
  return true;
}

export function tryParseCompCaptureBatch(text: string): CompCaptureBatch | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!isCompCaptureBatch(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function parseCompCaptureJson(
  text: string
): { batch: CompCaptureBatch | null; error: string | null } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { batch: null, error: "JSON input is empty." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { batch: null, error: "Invalid JSON." };
  }

  if (!isCompCaptureBatch(parsed)) {
    return {
      batch: null,
      error: "JSON must be a CompCaptureBatch with schemaVersion, source, and comps.",
    };
  }

  if (parsed.schemaVersion !== COMP_CAPTURE_SCHEMA_VERSION) {
    return {
      batch: null,
      error: `Unsupported schemaVersion "${parsed.schemaVersion}". Expected ${COMP_CAPTURE_SCHEMA_VERSION}.`,
    };
  }

  if (parsed.comps.length === 0) {
    return { batch: null, error: "Batch contains no comps." };
  }

  if (parsed.comps.length > MAX_BATCH_SIZE) {
    return {
      batch: null,
      error: `Batch exceeds maximum of ${MAX_BATCH_SIZE} comps.`,
    };
  }

  return { batch: parsed, error: null };
}

export function normalizeCapturedComps(
  batch: CompCaptureBatch,
  options: NormalizeCapturedCompsOptions = {}
): NormalizeCapturedCompsResult {
  const report: CompImportReport = {
    importedCount: 0,
    skippedCount: 0,
    duplicateCount: 0,
    warnings: [],
  };

  const createId = options.generateId ?? generateCompId;
  const existingKeys = new Set(
    (options.existingComps ?? []).map((comp) => compDedupeKey(comp))
  );
  const batchKeys = new Set<string>();
  const comps: ComparableSale[] = [];

  if (batch.schemaVersion !== COMP_CAPTURE_SCHEMA_VERSION) {
    report.warnings.push(
      `Unsupported schemaVersion "${batch.schemaVersion}" — import may be incomplete.`
    );
  }

  for (let index = 0; index < batch.comps.length; index += 1) {
    const { comp: captured, warning } = validateCapturedComp(
      batch.comps[index],
      index
    );
    if (!captured || warning) {
      report.skippedCount += 1;
      if (warning) report.warnings.push(warning);
      continue;
    }

    const platform = normalizeCapturedPlatform(captured.platform, batch.platform);
    const normalized = {
      title: captured.title,
      price: captured.price,
      platform,
      listingType: captured.listingType,
    };
    const key = compDedupeKey(normalized);

    if (existingKeys.has(key) || batchKeys.has(key)) {
      report.duplicateCount += 1;
      report.warnings.push(`Skipped duplicate: “${captured.title}” (${platform}, $${captured.price}).`);
      continue;
    }

    const mismatchWarnings = getCompTitleMismatchWarnings(captured.title, {
      itemIdentity: options.itemIdentity,
      compSearchQuery: options.compSearchQuery ?? batch.searchQuery,
    });
    report.warnings.push(...mismatchWarnings);

    batchKeys.add(key);
    existingKeys.add(key);

    comps.push({
      id: createId(),
      title: captured.title,
      platform,
      price: captured.price,
      condition: normalizeCapturedCondition(captured.condition),
      notes: buildComparableNotes(captured),
      listingType: captured.listingType,
    });
    report.importedCount += 1;
  }

  if (report.importedCount === 0 && report.skippedCount === 0 && report.duplicateCount === 0) {
    report.warnings.push("No comps were imported.");
  }

  return { comps, report };
}
