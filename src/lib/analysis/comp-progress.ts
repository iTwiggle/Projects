import { MIN_COMPS_FOR_ESTIMATE } from "@/lib/types/comps";
import type { ComparableSale } from "@/lib/types/comps";

export type CompProgressTier =
  | "rough"
  | "market_informed"
  | "strong"
  | "high_confidence";

export interface CompProgress {
  tier: CompProgressTier;
  label: string;
  validCount: number;
  soldCount: number;
  compsNeededForEstimate: number;
  compsNeededForHighConfidence: number;
  guidance: string;
  stepIndex: number;
}

const TIER_LABELS: Record<CompProgressTier, string> = {
  rough: "Rough Estimate",
  market_informed: "Market Informed",
  strong: "Strong Estimate",
  high_confidence: "High Confidence",
};

const TIER_STEP: Record<CompProgressTier, number> = {
  rough: 0,
  market_informed: 1,
  strong: 2,
  high_confidence: 3,
};

export function countValidComps(comps: ComparableSale[]): {
  validCount: number;
  soldCount: number;
} {
  const valid = comps.filter((comp) => comp.price > 0);
  return {
    validCount: valid.length,
    soldCount: valid.filter((comp) => comp.listingType === "sold").length,
  };
}

export function getCompProgressTier(
  validCount: number,
  soldCount: number
): CompProgressTier {
  if (validCount === 0) return "rough";
  if (soldCount >= 5) return "high_confidence";
  if (validCount >= 3) return "strong";
  return "market_informed";
}

function buildGuidance(
  tier: CompProgressTier,
  validCount: number,
  soldCount: number,
  compsNeededForEstimate: number,
  compsNeededForHighConfidence: number
): string {
  if (tier === "rough") {
    return compsNeededForEstimate > 0
      ? `Need ${compsNeededForEstimate} more comp${compsNeededForEstimate === 1 ? "" : "s"} to unlock a comps-based estimate.`
      : "Add sold or listed comps to improve your estimate.";
  }

  if (tier === "market_informed") {
    return compsNeededForEstimate > 0
      ? `Need ${compsNeededForEstimate} more comp${compsNeededForEstimate === 1 ? "" : "s"} to unlock a comps-based estimate.`
      : "A few comps help — add more for a stronger median.";
  }

  if (tier === "strong") {
    if (compsNeededForHighConfidence > 0) {
      return `Need ${compsNeededForHighConfidence} more sold comp${compsNeededForHighConfidence === 1 ? "" : "s"} for High Confidence.`;
    }
    return "Strong estimate — add more sold comps for highest confidence.";
  }

  void validCount;
  void soldCount;
  return "Five or more sold comps — your estimate is high confidence.";
}

export function getCompProgress(comps: ComparableSale[]): CompProgress {
  const { validCount, soldCount } = countValidComps(comps);
  const tier = getCompProgressTier(validCount, soldCount);
  const compsNeededForEstimate = Math.max(
    0,
    MIN_COMPS_FOR_ESTIMATE - validCount
  );
  const compsNeededForHighConfidence = Math.max(0, 5 - soldCount);

  return {
    tier,
    label: TIER_LABELS[tier],
    validCount,
    soldCount,
    compsNeededForEstimate,
    compsNeededForHighConfidence,
    guidance: buildGuidance(
      tier,
      validCount,
      soldCount,
      compsNeededForEstimate,
      compsNeededForHighConfidence
    ),
    stepIndex: TIER_STEP[tier],
  };
}

export function shouldAutoEnableCompsEstimate(
  comps: ComparableSale[],
  manualOff: boolean
): boolean {
  if (manualOff) return false;
  return comps.filter((comp) => comp.price > 0).length >= MIN_COMPS_FOR_ESTIMATE;
}

/** Resolve comps estimate toggle after comp list changes. */
export function resolveUseCompsForResale(
  comps: ComparableSale[],
  manualOff: boolean,
  previousUse: boolean
): boolean {
  const validCount = comps.filter((comp) => comp.price > 0).length;
  if (validCount < MIN_COMPS_FOR_ESTIMATE) return false;
  if (manualOff) return previousUse;
  return true;
}
