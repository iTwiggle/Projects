import { analyzeDeal } from "@/lib/analysis/engine";
import { getGoblinVerdict } from "@/lib/analysis/verdict";
import type { ComparableSale } from "@/lib/types/comps";
import type {
  DashboardStats,
  DealAnalysis,
  DealInput,
  LegacyDealFields,
  SavedDeal,
} from "@/lib/types/deal";
import { normalizeDealInput } from "@/lib/types/deal";

export interface SaveDealOptions {
  comps?: ComparableSale[];
  useCompsForResale?: boolean;
}

function normalizeComps(raw: unknown): ComparableSale[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (comp): comp is ComparableSale =>
      !!comp &&
      typeof comp === "object" &&
      typeof (comp as ComparableSale).id === "string" &&
      typeof (comp as ComparableSale).title === "string" &&
      typeof (comp as ComparableSale).price === "number"
  );
}

const STORAGE_KEY = "marketplace-goblin-deals";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isValidAnalysis(value: unknown): value is DealAnalysis {
  if (!value || typeof value !== "object") return false;
  const analysis = value as DealAnalysis;
  return (
    typeof analysis.potentialProfit === "number" &&
    typeof analysis.roiPercent === "number" &&
    typeof analysis.riskScore === "number" &&
    typeof analysis.flipScore === "number"
  );
}

function migrateSavedDeal(raw: DealInput & LegacyDealFields & Partial<SavedDeal>): SavedDeal | null {
  if (
    typeof raw.id !== "string" ||
    typeof raw.itemName !== "string" ||
    typeof raw.askingPrice !== "number" ||
    !isValidAnalysis(raw.analysis) ||
    !raw.verdict
  ) {
    return null;
  }

  const input = normalizeDealInput(raw);
  const comps = normalizeComps(raw.comps);
  const useCompsForResale = raw.useCompsForResale === true;
  const analysisOptions = { comps, useCompsForResale };
  const analysis =
    raw.analysis?.resaleEstimate !== undefined && !useCompsForResale
      ? raw.analysis
      : analyzeDeal(input, analysisOptions);
  const verdict = raw.verdict ?? getGoblinVerdict(input, analysis);

  return {
    ...input,
    id: raw.id,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    comps,
    useCompsForResale,
    analysis,
    verdict,
  };
}

export function loadDeals(): SavedDeal[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((deal) => migrateSavedDeal(deal as DealInput & LegacyDealFields & Partial<SavedDeal>))
      .filter((deal): deal is SavedDeal => deal !== null);
  } catch {
    return [];
  }
}

export function saveDeals(deals: SavedDeal[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
}

export function createDeal(
  input: DealInput,
  options?: SaveDealOptions
): SavedDeal {
  const normalized = normalizeDealInput(input);
  const comps = options?.comps ?? [];
  const useCompsForResale = options?.useCompsForResale ?? false;
  const analysisOptions = { comps, useCompsForResale };
  const analysis = analyzeDeal(normalized, analysisOptions);
  const verdict = getGoblinVerdict(normalized, analysis);
  const now = new Date().toISOString();

  return {
    ...normalized,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    comps,
    useCompsForResale,
    analysis,
    verdict,
  };
}

export function updateDeal(
  deals: SavedDeal[],
  id: string,
  input: DealInput
): SavedDeal[] {
  return deals.map((deal) => {
    if (deal.id !== id) return deal;

    const normalized = normalizeDealInput(input);
    const analysisOptions = {
      comps: deal.comps,
      useCompsForResale: deal.useCompsForResale,
    };
    const analysis = analyzeDeal(normalized, analysisOptions);
    const verdict = getGoblinVerdict(normalized, analysis);

    return {
      ...normalized,
      id: deal.id,
      createdAt: deal.createdAt,
      updatedAt: new Date().toISOString(),
      comps: deal.comps,
      useCompsForResale: deal.useCompsForResale,
      analysis,
      verdict,
    };
  });
}

export function updateDealComps(
  deals: SavedDeal[],
  id: string,
  comps: ComparableSale[],
  useCompsForResale: boolean
): SavedDeal[] {
  return deals.map((deal) => {
    if (deal.id !== id) return deal;

    const analysisOptions = { comps, useCompsForResale };
    const analysis = analyzeDeal(deal, analysisOptions);
    const verdict = getGoblinVerdict(deal, analysis);

    return {
      ...deal,
      comps,
      useCompsForResale,
      analysis,
      verdict,
      updatedAt: new Date().toISOString(),
    };
  });
}

export function deleteDeal(deals: SavedDeal[], id: string): SavedDeal[] {
  return deals.filter((deal) => deal.id !== id);
}

export function calculateDashboardStats(deals: SavedDeal[]): DashboardStats {
  if (deals.length === 0) {
    return {
      totalDeals: 0,
      totalPotentialProfit: 0,
      averageRoi: 0,
      bestDeal: null,
    };
  }

  const totalPotentialProfit = deals.reduce(
    (sum, deal) => sum + deal.analysis.potentialProfit,
    0
  );

  const averageRoi =
    deals.reduce((sum, deal) => sum + deal.analysis.roiPercent, 0) /
    deals.length;

  const bestDeal = deals.reduce<SavedDeal | null>((best, deal) => {
    if (!best) return deal;
    return deal.analysis.potentialProfit > best.analysis.potentialProfit
      ? deal
      : best;
  }, null);

  return {
    totalDeals: deals.length,
    totalPotentialProfit,
    averageRoi,
    bestDeal,
  };
}
