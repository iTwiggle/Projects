import { analyzeDeal } from "@/lib/analysis/engine";
import { getGoblinVerdict } from "@/lib/analysis/verdict";
import type {
  DashboardStats,
  DealAnalysis,
  DealInput,
  LegacyDealFields,
  SavedDeal,
} from "@/lib/types/deal";
import { normalizeDealInput } from "@/lib/types/deal";

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
  const analysis =
    raw.analysis?.resaleEstimate !== undefined
      ? raw.analysis
      : analyzeDeal(input);
  const verdict = raw.verdict ?? getGoblinVerdict(input, analysis);

  return {
    ...input,
    id: raw.id,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
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

export function createDeal(input: DealInput): SavedDeal {
  const normalized = normalizeDealInput(input);
  const analysis = analyzeDeal(normalized);
  const verdict = getGoblinVerdict(normalized, analysis);
  const now = new Date().toISOString();

  return {
    ...normalized,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    analysis,
    verdict,
  };
}

export function updateDeal(
  deals: SavedDeal[],
  id: string,
  input: DealInput
): SavedDeal[] {
  const normalized = normalizeDealInput(input);
  const analysis = analyzeDeal(normalized);
  const verdict = getGoblinVerdict(normalized, analysis);

  return deals.map((deal) =>
    deal.id === id
      ? {
          ...normalized,
          id: deal.id,
          createdAt: deal.createdAt,
          updatedAt: new Date().toISOString(),
          analysis,
          verdict,
        }
      : deal
  );
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
