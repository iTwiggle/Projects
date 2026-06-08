import { analyzeDeal } from "@/lib/analysis/engine";
import type { DealAnalysis, DealInput, GoblinVerdict } from "@/lib/types/deal";
import {
  BRAIN_MODES,
  type BrainModeDefinition,
  type BrainModeId,
  type BrainModeResult,
} from "@/lib/types/brain-mode";

const PART_OUT_MULTIPLIERS: Partial<Record<DealInput["category"], number>> = {
  Electronics: 1.4,
  "Vehicles & Parts": 1.55,
  Appliances: 1.35,
  "Tools & Hardware": 1.3,
  "Toys & Games": 1.2,
  "Sports & Outdoors": 1.15,
};

const HIDDEN_OPPORTUNITY_KEYWORDS = [
  "estate",
  "moving",
  "must go",
  "must sell",
  "divorce",
  "downsizing",
  "urgent",
  "obo",
  "or best offer",
  "make offer",
  "priced to sell",
  "needs gone",
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatTimeToSell(days: number): string {
  if (days <= 7) return "Under 1 week";
  if (days <= 14) return "1–2 weeks";
  if (days <= 30) return "2–4 weeks";
  if (days <= 60) return "1–2 months";
  if (days <= 90) return "2–3 months";
  return "3+ months";
}

function hasOpportunitySignals(input: DealInput): boolean {
  const haystack = `${input.notes} ${input.itemName}`.toLowerCase();
  return HIDDEN_OPPORTUNITY_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

function applyMoreProfitable(input: DealInput): {
  adjusted: DealInput;
  adjustments: string[];
} {
  const negotiatedAsk = Math.round(input.askingPrice * 0.88);
  const premiumResale = Math.round(input.estimatedResaleValue * 1.12);

  return {
    adjusted: {
      ...input,
      askingPrice: negotiatedAsk,
      estimatedResaleValue: premiumResale,
    },
    adjustments: [
      `Assumes ${((1 - negotiatedAsk / Math.max(input.askingPrice, 1)) * 100).toFixed(0)}% off asking after haggling.`,
      "Prices for premium channels — eBay, niche forums, collector groups.",
      "Willing to hold longer for top dollar.",
    ],
  };
}

function applyFasterFlip(input: DealInput): {
  adjusted: DealInput;
  adjustments: string[];
} {
  const quickSaleResale = Math.round(input.estimatedResaleValue * 0.82);

  return {
    adjusted: {
      ...input,
      estimatedResaleValue: quickSaleResale,
    },
    adjustments: [
      "Prices to move in days, not weeks — local pickup, same-day cash.",
      "Accepts lower margin for zero holding cost.",
      "Optimized for OfferUp, Facebook Marketplace quick sales.",
    ],
  };
}

function applyPartOut(input: DealInput): {
  adjusted: DealInput;
  adjustments: string[];
} {
  const multiplier = PART_OUT_MULTIPLIERS[input.category] ?? 1.08;
  const partsResale = Math.round(input.estimatedResaleValue * multiplier);
  const laborCost = Math.round(input.askingPrice * 0.05 + 25);

  return {
    adjusted: {
      ...input,
      estimatedResaleValue: partsResale,
      askingPrice: input.askingPrice + laborCost,
      notes: input.notes
        ? `${input.notes} [Part-out: teardown, list, ship labor factored in]`
        : "[Part-out: teardown, list, ship labor factored in]",
    },
    adjustments: [
      multiplier >= 1.25
        ? `${input.category} has strong part-out demand — motors, boards, and accessories sell separately.`
        : "Limited part-out upside for this category — whole-item sale may be better.",
      `Adds ~$${laborCost} labor cost for teardown, photos, and multi-listing.`,
      "Timeline stretches — but total haul can beat a single flip.",
    ],
  };
}

function applyWorstCase(input: DealInput): {
  adjusted: DealInput;
  adjustments: string[];
} {
  const pessimisticResale = Math.round(input.estimatedResaleValue * 0.72);
  const surpriseCosts = Math.round(input.askingPrice * 0.08 + 15);

  return {
    adjusted: {
      ...input,
      askingPrice: input.askingPrice + surpriseCosts,
      estimatedResaleValue: pessimisticResale,
    },
    adjustments: [
      "Comps priced at the low end — slow market, bad photos, wrong season.",
      `Adds $${surpriseCosts} for gas, platform fees, and buyer flaking.`,
      "Assumes one price drop and a longer sit before sale.",
    ],
  };
}

function applyHiddenOpportunity(input: DealInput): {
  adjusted: DealInput;
  adjustments: string[];
} {
  const signals = hasOpportunitySignals(input);
  const nicheBoost = signals ? 1.22 : 1.14;
  const motivatedDiscount = signals
    ? Math.round(input.askingPrice * 0.92)
    : input.askingPrice;

  return {
    adjusted: {
      ...input,
      askingPrice: motivatedDiscount,
      estimatedResaleValue: Math.round(input.estimatedResaleValue * nicheBoost),
    },
    adjustments: signals
      ? [
          "Seller signals detected — motivated to deal, room to negotiate.",
          "Niche buyer pool may pay above typical comps.",
          "Cross-list to collector communities and specialty groups.",
        ]
      : [
          "No obvious seller desperation — still hunting for undervalued angles.",
          "Check sold comps in adjacent categories and bundled lots.",
          "Seasonal or local demand spikes could lift resale.",
        ],
  };
}

function transformInput(
  modeId: BrainModeId,
  input: DealInput
): { adjusted: DealInput; adjustments: string[] } {
  switch (modeId) {
    case "more_profitable":
      return applyMoreProfitable(input);
    case "faster_flip":
      return applyFasterFlip(input);
    case "part_out":
      return applyPartOut(input);
    case "worst_case":
      return applyWorstCase(input);
    case "hidden_opportunity":
      return applyHiddenOpportunity(input);
  }
}

function tuneAnalysis(
  modeId: BrainModeId,
  base: DealAnalysis,
  input: DealInput
): DealAnalysis {
  const analysis = { ...base };

  switch (modeId) {
    case "more_profitable":
      analysis.timeToSellDays = Math.round(base.timeToSellDays * 1.35);
      analysis.riskScore = clamp(base.riskScore + 1, 1, 10);
      analysis.flipScore = clamp(base.flipScore - 1, 1, 10);
      break;
    case "faster_flip":
      analysis.timeToSellDays = Math.max(3, Math.round(base.timeToSellDays * 0.45));
      analysis.riskScore = clamp(base.riskScore - 1, 1, 10);
      analysis.flipScore = clamp(base.flipScore + 1, 1, 10);
      break;
    case "part_out":
      analysis.timeToSellDays = Math.round(base.timeToSellDays * 2.2);
      analysis.riskScore = clamp(base.riskScore + 2, 1, 10);
      analysis.flipScore =
        (PART_OUT_MULTIPLIERS[input.category] ?? 1) >= 1.25
          ? clamp(base.flipScore + 1, 1, 10)
          : clamp(base.flipScore - 1, 1, 10);
      break;
    case "worst_case":
      analysis.timeToSellDays = Math.round(base.timeToSellDays * 1.5);
      analysis.riskScore = clamp(base.riskScore + 2, 1, 10);
      analysis.flipScore = clamp(base.flipScore - 2, 1, 10);
      break;
    case "hidden_opportunity":
      analysis.timeToSellDays = Math.round(base.timeToSellDays * 0.85);
      analysis.riskScore = clamp(base.riskScore, 1, 10);
      analysis.flipScore = clamp(base.flipScore + 1, 1, 10);
      break;
  }

  analysis.timeToSellLabel = formatTimeToSell(analysis.timeToSellDays);
  return analysis;
}

function getModeVerdict(
  mode: BrainModeDefinition,
  input: DealInput,
  analysis: DealAnalysis,
  adjustments: string[]
): GoblinVerdict {
  const { potentialProfit, roiPercent, riskScore, flipScore } = analysis;

  const isReject =
    potentialProfit <= 0 ||
    riskScore >= 8 ||
    flipScore <= 3 ||
    (potentialProfit > 0 && roiPercent < 10);

  const isApproved =
    !isReject &&
    flipScore >= 7 &&
    riskScore <= 4 &&
    potentialProfit > 0 &&
    roiPercent >= 25;

  const perspective: string[] = [];

  switch (mode.id) {
    case "more_profitable":
      perspective.push(
        `Grik sees $${potentialProfit.toFixed(0)} if you squeeze every margin.`
      );
      if (roiPercent >= 40) {
        perspective.push("Stack platforms — list high, accept offers on day 14.");
      } else {
        perspective.push("Margins are tight even after negotiation — push harder on price.");
      }
      break;
    case "faster_flip":
      perspective.push(
        `Zip wants this gone in ${analysis.timeToSellLabel} — price to sell, not to admire.`
      );
      if (potentialProfit > 0) {
        perspective.push(
          `$${potentialProfit.toFixed(0)} fast beats $${Math.round(potentialProfit * 1.4)} in two months.`
        );
      } else {
        perspective.push("Even at fire-sale pricing, the numbers barely work.");
      }
      break;
    case "part_out":
      if ((PART_OUT_MULTIPLIERS[input.category] ?? 1) >= 1.25) {
        perspective.push("Wrench smells salvage gold — part it before someone else does.");
        perspective.push(
          `Total parts haul: ~$${analysis.potentialProfit.toFixed(0)} profit after labor.`
        );
      } else {
        perspective.push("Not much part-out upside here — Wrench says flip whole or walk.");
      }
      break;
    case "worst_case":
      perspective.push("Murk ran the nightmare spreadsheet. This is the floor, not the ceiling.");
      if (potentialProfit <= 0) {
        perspective.push("If even Murk's grim math fails, this deal has no cushion.");
      } else {
        perspective.push(
          `Only $${potentialProfit.toFixed(0)} left if everything goes sideways — thin buffer.`
        );
      }
      break;
    case "hidden_opportunity":
      perspective.push("Glimmer senses something the listing doesn't say out loud.");
      if (hasOpportunitySignals(input)) {
        perspective.push("Motivated seller + niche demand = the goblin sweet spot.");
      } else {
        perspective.push("Dig deeper — check sold listings, local groups, and seasonal buyers.");
      }
      break;
  }

  perspective.push(...adjustments.slice(0, 1));

  if (isApproved) {
    return {
      type: "approved",
      label: `${mode.goblinName} Says: Go For It`,
      emoji: "🟢",
      reasoning: perspective,
    };
  }

  if (isReject) {
    return {
      type: "reject",
      label: `${mode.goblinName} Says: Walk Away`,
      emoji: "🔴",
      reasoning: perspective,
    };
  }

  return {
    type: "caution",
    label: `${mode.goblinName} Says: Maybe`,
    emoji: "🟡",
    reasoning: perspective,
  };
}

function buildPerspective(
  mode: BrainModeDefinition,
  baseAnalysis: DealAnalysis,
  modeAnalysis: DealAnalysis
): string[] {
  const profitDelta = modeAnalysis.potentialProfit - baseAnalysis.potentialProfit;
  const timeDelta = modeAnalysis.timeToSellDays - baseAnalysis.timeToSellDays;

  const lines = [`${mode.goblinName} (${mode.title}) re-ran the numbers.`];

  if (profitDelta !== 0) {
    lines.push(
      profitDelta > 0
        ? `Profit shifts +$${Math.abs(profitDelta).toFixed(0)} vs standard analysis.`
        : `Profit drops $${Math.abs(profitDelta).toFixed(0)} vs standard analysis.`
    );
  }

  if (timeDelta !== 0) {
    lines.push(
      timeDelta < 0
        ? `Time to sell shortens by ~${Math.abs(timeDelta)} days.`
        : `Time to sell stretches by ~${timeDelta} days.`
    );
  }

  return lines;
}

export function analyzeWithBrainMode(
  input: DealInput,
  modeId: BrainModeId
): BrainModeResult {
  const mode = BRAIN_MODES[modeId];
  const baseAnalysis = analyzeDeal(input);
  const { adjusted, adjustments } = transformInput(modeId, input);
  const rawAnalysis = analyzeDeal(adjusted);
  const analysis = tuneAnalysis(modeId, rawAnalysis, input);
  const verdict = getModeVerdict(mode, input, analysis, adjustments);

  return {
    mode,
    adjustedInput: adjusted,
    analysis,
    verdict,
    perspective: buildPerspective(mode, baseAnalysis, analysis),
    adjustments,
  };
}
