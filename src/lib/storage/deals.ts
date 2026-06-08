import { analyzeDeal } from "@/lib/analysis/engine";
import { getGoblinVerdict } from "@/lib/analysis/verdict";
import type { DashboardStats, DealInput, SavedDeal } from "@/lib/types/deal";

const STORAGE_KEY = "marketplace-goblin-deals";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isValidSavedDeal(value: unknown): value is SavedDeal {
  if (!value || typeof value !== "object") return false;
  const deal = value as SavedDeal;
  return (
    typeof deal.id === "string" &&
    typeof deal.itemName === "string" &&
    typeof deal.askingPrice === "number" &&
    typeof deal.estimatedResaleValue === "number" &&
    deal.analysis !== undefined &&
    deal.verdict !== undefined
  );
}

export function loadDeals(): SavedDeal[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidSavedDeal);
  } catch {
    return [];
  }
}

export function saveDeals(deals: SavedDeal[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
}

export function createDeal(input: DealInput): SavedDeal {
  const analysis = analyzeDeal(input);
  const verdict = getGoblinVerdict(input, analysis);
  const now = new Date().toISOString();

  return {
    ...input,
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
  const analysis = analyzeDeal(input);
  const verdict = getGoblinVerdict(input, analysis);

  return deals.map((deal) =>
    deal.id === id
      ? {
          ...input,
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
