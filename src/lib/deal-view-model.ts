import { buildCategoryIntelligence } from "@/lib/analysis/category-intelligence";
import { getItemIdentity } from "@/lib/analysis/item-identity";
import { analyzeDeal } from "@/lib/analysis/engine";
import { calculateCompSummary } from "@/lib/analysis/comp-calculations";
import { calculateHaggleGuide } from "@/lib/analysis/haggle-calculations";
import {
  getConfidenceLabel,
  getResaleSourceLabel,
  resolveDeal,
} from "@/lib/analysis/resale-estimate";
import { getGoblinVerdict } from "@/lib/analysis/verdict";
import { formatCurrency } from "@/lib/format";
import type { CompSummary } from "@/lib/types/comps";
import type {
  DealAnalysis,
  DealInput,
  EstimateConfidence,
  GoblinVerdict,
  ResolvedDeal,
  ResaleEstimate,
  SavedDeal,
  VerdictType,
} from "@/lib/types/deal";
import { hasManualResaleValue, normalizeDealInput } from "@/lib/types/deal";
import type { ComparableSale } from "@/lib/types/comps";
import type { CategoryIntelligence } from "@/lib/types/category-intelligence";
import type {
  IdentityConfidence,
  ItemIdentity,
  ItemIdentitySources,
} from "@/lib/types/item-identity";
import type { HaggleGuide } from "@/lib/types/haggle";
import { resolveListingLink } from "@/lib/intake/listing-url";
import type { ListingLinkInfo } from "@/lib/types/listing-url";

export const VERDICT_BADGE_STYLES: Record<VerdictType, string> = {
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  caution: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  reject: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export const CONFIDENCE_TEXT_STYLES: Record<EstimateConfidence, string> = {
  low: "text-rose-400",
  medium: "text-amber-400",
  high: "text-emerald-400",
};

export interface DealViewModelDisplay {
  resaleSourceLabel: string;
  confidenceLabel: string;
  verdictBadgeClassName: string;
  confidenceTextClassName: string;
  resaleDisplay: string;
  showResaleRange: boolean;
  profitPositive: boolean;
  warnings: string[];
  advice: string[];
}

export interface DealViewModelCategoryIntel {
  intelligence: CategoryIntelligence;
  inspectionChecklist: string[];
}

export interface DealViewModelIdentitySummary {
  confidence: IdentityConfidence;
  evidenceCount: number;
  hasConflict: boolean;
  warnings: string[];
}

export interface DealViewModel {
  id: string;
  createdAt: string;
  updatedAt: string;
  input: DealInput;
  comps: SavedDeal["comps"];
  useCompsForResale: boolean;
  compSummary: CompSummary | null;
  resolved: ResolvedDeal;
  analysis: DealAnalysis;
  verdict: GoblinVerdict;
  display: DealViewModelDisplay;
  haggle: HaggleGuide;
  listing: ListingLinkInfo;
  categoryIntel: DealViewModelCategoryIntel;
  itemIdentity: ItemIdentity;
  identity: DealViewModelIdentitySummary;
}

function buildResaleDisplay(estimate: ResaleEstimate): {
  resaleDisplay: string;
  showResaleRange: boolean;
} {
  const showResaleRange =
    estimate.low !== estimate.high && estimate.source !== "manual";

  const resaleDisplay = showResaleRange
    ? `${formatCurrency(estimate.low)}–${formatCurrency(estimate.high)}`
    : formatCurrency(estimate.midpoint);

  return { resaleDisplay, showResaleRange };
}

function buildIdentitySummary(identity: ItemIdentity): DealViewModelIdentitySummary {
  return {
    confidence: identity.confidence,
    evidenceCount: identity.evidence.matchCount,
    hasConflict: identity.hasConflict,
    warnings: identity.warnings,
  };
}

function buildWarnings(
  input: DealInput,
  analysis: DealAnalysis,
  useCompsForResale: boolean,
  compSummary: CompSummary | null,
  categoryIntel: CategoryIntelligence,
  itemIdentity: ItemIdentity
): string[] {
  const warnings: string[] = [
    ...categoryIntel.warnings,
    ...itemIdentity.warnings,
  ];
  const { resaleEstimate } = analysis;

  if (hasManualResaleValue(input) && useCompsForResale) {
    warnings.push(
      "Manual resale value overrides comps — comps are saved but not used for the estimate."
    );
  }

  if (resaleEstimate.source === "estimated") {
    warnings.push("Fast triage only. Verify comps before buying.");
  }

  if (resaleEstimate.source === "comps") {
    warnings.push(
      "Resale estimate uses the median of your comparable sales."
    );
  }

  if (
    resaleEstimate.source === "comps" &&
    compSummary &&
    compSummary.listedCount > compSummary.soldCount
  ) {
    warnings.push(
      "Mostly listed comps — sold prices are usually more reliable."
    );
  }

  return warnings;
}

function buildDisplay(
  input: DealInput,
  analysis: DealAnalysis,
  verdict: GoblinVerdict,
  useCompsForResale: boolean,
  compSummary: CompSummary | null,
  categoryIntel: CategoryIntelligence,
  itemIdentity: ItemIdentity
): DealViewModelDisplay {
  const estimate = analysis.resaleEstimate;
  const { resaleDisplay, showResaleRange } = buildResaleDisplay(estimate);

  return {
    resaleSourceLabel: getResaleSourceLabel(estimate.source),
    confidenceLabel: getConfidenceLabel(estimate.confidence),
    verdictBadgeClassName: VERDICT_BADGE_STYLES[verdict.type],
    confidenceTextClassName: CONFIDENCE_TEXT_STYLES[estimate.confidence],
    resaleDisplay,
    showResaleRange,
    profitPositive: analysis.potentialProfit >= 0,
    warnings: buildWarnings(
      input,
      analysis,
      useCompsForResale,
      compSummary,
      categoryIntel,
      itemIdentity
    ),
    advice: categoryIntel.advice,
  };
}

function buildDealViewModel(
  input: DealInput,
  comps: ComparableSale[],
  useCompsForResale: boolean,
  meta: { id: string; createdAt: string; updatedAt: string },
  identitySources?: ItemIdentitySources
): DealViewModel {
  const itemIdentity = getItemIdentity(input, comps, identitySources);
  const categoryIntel = buildCategoryIntelligence(input, comps, itemIdentity);
  const analysisOptions = {
    comps,
    useCompsForResale,
    categoryIntel,
    itemIdentity,
    identitySources,
  };
  const resolved = resolveDeal(input, analysisOptions);
  const analysis = analyzeDeal(input, analysisOptions);
  const verdict = getGoblinVerdict(
    input,
    analysis,
    categoryIntel,
    itemIdentity
  );
  const compSummary = calculateCompSummary(comps);
  const display = buildDisplay(
    input,
    analysis,
    verdict,
    useCompsForResale,
    compSummary,
    categoryIntel,
    itemIdentity
  );
  const haggle = calculateHaggleGuide(
    input,
    analysis,
    resolved.effectiveResaleValue,
    categoryIntel
  );
  const listing = resolveListingLink(input.listingUrl);

  return {
    id: meta.id,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    input,
    comps,
    useCompsForResale,
    compSummary,
    resolved,
    analysis,
    verdict,
    display,
    haggle,
    listing,
    categoryIntel: {
      intelligence: categoryIntel,
      inspectionChecklist: categoryIntel.inspectionChecklist,
    },
    itemIdentity,
    identity: buildIdentitySummary(itemIdentity),
  };
}

/** Single source of truth for derived saved-deal data shown in the UI. */
export function getDealViewModel(deal: SavedDeal): DealViewModel {
  const input = normalizeDealInput(deal);
  return buildDealViewModel(
    input,
    deal.comps ?? [],
    deal.useCompsForResale === true,
    {
      id: deal.id,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    }
  );
}

/** View model for unsaved Analyze preview (temporary comps until save). */
export function getPreviewViewModel(
  input: DealInput,
  comps: ComparableSale[],
  useCompsForResale: boolean,
  identitySources?: ItemIdentitySources
): DealViewModel {
  const normalized = normalizeDealInput(input);
  return buildDealViewModel(
    normalized,
    comps,
    useCompsForResale,
    {
      id: "preview",
      createdAt: "",
      updatedAt: "",
    },
    identitySources
  );
}

export function getDealViewModels(deals: SavedDeal[]): DealViewModel[] {
  return deals.map(getDealViewModel);
}
