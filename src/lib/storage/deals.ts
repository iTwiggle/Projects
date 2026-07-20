import { buildCategoryIntelligence } from "@/lib/analysis/category-intelligence";
import { analyzeDeal } from "@/lib/analysis/engine";
import { getItemIdentity } from "@/lib/analysis/item-identity";
import { getGoblinVerdict } from "@/lib/analysis/verdict";
import { getDealViewModel } from "@/lib/deal-view-model";
import type { ComparableSale } from "@/lib/types/comps";
import type {
  DashboardStats,
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

function migrateSavedDeal(raw: DealInput & LegacyDealFields & Partial<SavedDeal>): SavedDeal | null {
  if (
    typeof raw.id !== "string" ||
    typeof raw.itemName !== "string" ||
    typeof raw.askingPrice !== "number"
  ) {
    return null;
  }

  const input = normalizeDealInput(raw);
  const comps = normalizeComps(raw.comps);
  const useCompsForResale = raw.useCompsForResale === true;
  const itemIdentity = getItemIdentity(input, comps);
  const categoryIntel = buildCategoryIntelligence(input, comps, itemIdentity);
  const analysisOptions = {
    comps,
    useCompsForResale,
    categoryIntel,
    itemIdentity,
  };

  // Refresh cached analysis/verdict from inputs on load; UI reads via getDealViewModel.
  const analysis = analyzeDeal(input, analysisOptions);
  const verdict = getGoblinVerdict(
    input,
    analysis,
    categoryIntel,
    itemIdentity
  );

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
  const itemIdentity = getItemIdentity(normalized, comps);
  const categoryIntel = buildCategoryIntelligence(
    normalized,
    comps,
    itemIdentity
  );
  const analysisOptions = {
    comps,
    useCompsForResale,
    categoryIntel,
    itemIdentity,
  };
  const analysis = analyzeDeal(normalized, analysisOptions);
  const verdict = getGoblinVerdict(
    normalized,
    analysis,
    categoryIntel,
    itemIdentity
  );
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
    const itemIdentity = getItemIdentity(normalized, deal.comps);
    const categoryIntel = buildCategoryIntelligence(
      normalized,
      deal.comps,
      itemIdentity
    );
    const analysisOptions = {
      comps: deal.comps,
      useCompsForResale: deal.useCompsForResale,
      categoryIntel,
      itemIdentity,
    };
    const analysis = analyzeDeal(normalized, analysisOptions);
    const verdict = getGoblinVerdict(
      normalized,
      analysis,
      categoryIntel,
      itemIdentity
    );

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

    const itemIdentity = getItemIdentity(deal, comps);
    const categoryIntel = buildCategoryIntelligence(deal, comps, itemIdentity);
    const analysisOptions = {
      comps,
      useCompsForResale,
      categoryIntel,
      itemIdentity,
    };
    const analysis = analyzeDeal(deal, analysisOptions);
    const verdict = getGoblinVerdict(
      deal,
      analysis,
      categoryIntel,
      itemIdentity
    );

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

  const viewModels = deals.map(getDealViewModel);

  const totalPotentialProfit = viewModels.reduce(
    (sum, vm) => sum + vm.analysis.potentialProfit,
    0
  );

  const averageRoi =
    viewModels.reduce((sum, vm) => sum + vm.analysis.roiPercent, 0) /
    viewModels.length;

  const best = viewModels.reduce<(typeof viewModels)[number] | null>(
    (current, vm) => {
      if (!current) return vm;
      return vm.analysis.potentialProfit > current.analysis.potentialProfit
        ? vm
        : current;
    },
    null
  );

  return {
    totalDeals: deals.length,
    totalPotentialProfit,
    averageRoi,
    bestDeal: best
      ? {
          itemName: best.input.itemName,
          potentialProfit: best.analysis.potentialProfit,
        }
      : null,
  };
}
