import type { IntakeExtractionSource } from "@/lib/types/intake-source";
import type { ResaleSource } from "@/lib/types/deal";

const USAGE_STORAGE_KEY = "marketplace-goblin-usage-v1";

export const USAGE_TELEMETRY_VERSION = 1 as const;

export type CompImportChannel = "extension" | "json" | "paste";

export interface UsageTelemetry {
  version: typeof USAGE_TELEMETRY_VERSION;
  listingsImported: number;
  listingsImportedBySource: Record<IntakeExtractionSource, number>;
  facebookCapturesReceived: number;
  facebookCapturesImported: number;
  ebayCapturesReceived: number;
  ebayCapturesImported: number;
  compImportEvents: number;
  compsImported: number;
  compImportsByChannel: Record<CompImportChannel, number>;
  dealsAnalyzed: number;
  dealsSaved: number;
  totalCompsOnSavedDeals: number;
  quickEstimateUsed: number;
  compEstimateUsed: number;
  firstRecordedAt: string;
  updatedAt: string;
}

const listeners = new Set<() => void>();

function emptyBySource(): Record<IntakeExtractionSource, number> {
  return {
    url_autofill: 0,
    ocr: 0,
    manual: 0,
    extension: 0,
  };
}

function emptyByChannel(): Record<CompImportChannel, number> {
  return {
    extension: 0,
    json: 0,
    paste: 0,
  };
}

export function createEmptyUsageTelemetry(): UsageTelemetry {
  const now = new Date().toISOString();
  return {
    version: USAGE_TELEMETRY_VERSION,
    listingsImported: 0,
    listingsImportedBySource: emptyBySource(),
    facebookCapturesReceived: 0,
    facebookCapturesImported: 0,
    ebayCapturesReceived: 0,
    ebayCapturesImported: 0,
    compImportEvents: 0,
    compsImported: 0,
    compImportsByChannel: emptyByChannel(),
    dealsAnalyzed: 0,
    dealsSaved: 0,
    totalCompsOnSavedDeals: 0,
    quickEstimateUsed: 0,
    compEstimateUsed: 0,
    firstRecordedAt: now,
    updatedAt: now,
  };
}

function isUsageTelemetry(value: unknown): value is UsageTelemetry {
  if (!value || typeof value !== "object") return false;
  const data = value as UsageTelemetry;
  return data.version === USAGE_TELEMETRY_VERSION;
}

function mergeUsageTelemetry(parsed: UsageTelemetry): UsageTelemetry {
  return {
    ...createEmptyUsageTelemetry(),
    ...parsed,
    listingsImportedBySource: {
      ...emptyBySource(),
      ...parsed.listingsImportedBySource,
    },
    compImportsByChannel: {
      ...emptyByChannel(),
      ...parsed.compImportsByChannel,
    },
  };
}

export function loadUsageTelemetry(): UsageTelemetry {
  if (typeof localStorage === "undefined") {
    return createEmptyUsageTelemetry();
  }

  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) return createEmptyUsageTelemetry();
    const parsed: unknown = JSON.parse(raw);
    if (!isUsageTelemetry(parsed)) return createEmptyUsageTelemetry();
    return mergeUsageTelemetry(parsed);
  } catch {
    return createEmptyUsageTelemetry();
  }
}

export function saveUsageTelemetry(data: UsageTelemetry): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(data));
  listeners.forEach((listener) => listener());
}

export function resetUsageTelemetry(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(USAGE_STORAGE_KEY);
  listeners.forEach((listener) => listener());
}

export function subscribeUsageTelemetry(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function mutateUsage(mutator: (current: UsageTelemetry) => void): void {
  const current = loadUsageTelemetry();
  mutator(current);
  current.updatedAt = new Date().toISOString();
  saveUsageTelemetry(current);
}

export function getAverageCompsPerDeal(stats: UsageTelemetry): number | null {
  if (stats.dealsSaved <= 0) return null;
  return Math.round((stats.totalCompsOnSavedDeals / stats.dealsSaved) * 10) / 10;
}

export function isEbayCapturePlatform(platform: string | undefined): boolean {
  if (!platform) return false;
  return platform.toLowerCase().includes("ebay");
}

export function recordListingImported(source: IntakeExtractionSource): void {
  mutateUsage((stats) => {
    stats.listingsImported += 1;
    stats.listingsImportedBySource[source] += 1;
  });
}

export function recordFacebookCaptureReceived(): void {
  mutateUsage((stats) => {
    stats.facebookCapturesReceived += 1;
  });
}

export function recordFacebookCaptureImported(): void {
  mutateUsage((stats) => {
    stats.facebookCapturesImported += 1;
  });
}

export function recordEbayCaptureReceived(): void {
  mutateUsage((stats) => {
    stats.ebayCapturesReceived += 1;
  });
}

export function recordEbayCaptureImported(): void {
  mutateUsage((stats) => {
    stats.ebayCapturesImported += 1;
  });
}

export function recordCompImport(count: number, channel: CompImportChannel): void {
  if (count <= 0) return;
  mutateUsage((stats) => {
    stats.compImportEvents += 1;
    stats.compsImported += count;
    stats.compImportsByChannel[channel] += 1;
  });
}

export function recordDealAnalyzed(resaleSource: ResaleSource): void {
  mutateUsage((stats) => {
    stats.dealsAnalyzed += 1;
    if (resaleSource === "estimated") {
      stats.quickEstimateUsed += 1;
    }
    if (resaleSource === "comps") {
      stats.compEstimateUsed += 1;
    }
  });
}

export function recordDealSaved(compCount: number): void {
  mutateUsage((stats) => {
    stats.dealsSaved += 1;
    stats.totalCompsOnSavedDeals += Math.max(0, compCount);
  });
}
