import type { ConceptScores, ScoreWeights } from "@/types/concept";

export function computeWeightedScore(
  scores: ConceptScores,
  weights: ScoreWeights
): number {
  const entries = Object.keys(scores) as (keyof ConceptScores)[];
  let total = 0;
  let weightSum = 0;

  for (const key of entries) {
    const w = weights[key];
    total += scores[key] * w;
    weightSum += w;
  }

  return Math.round(total / weightSum);
}

export function scoreColor(value: number): string {
  if (value >= 80) return "var(--forge-emerald)";
  if (value >= 60) return "var(--forge-cyan)";
  if (value >= 40) return "var(--forge-amber)";
  return "var(--forge-rose)";
}

export function scoreLabel(value: number): string {
  if (value >= 85) return "Exceptional";
  if (value >= 70) return "Strong";
  if (value >= 55) return "Viable";
  if (value >= 40) return "Risky";
  return "Speculative";
}

export const SCORE_DIMENSIONS: {
  key: keyof ConceptScores;
  label: string;
  description: string;
}[] = [
  {
    key: "originality",
    label: "Originality",
    description: "How distinct from obvious clones",
  },
  {
    key: "profitability",
    label: "Profitability",
    description: "Revenue path clarity and margin potential",
  },
  {
    key: "feasibility",
    label: "Feasibility",
    description: "Can a small team ship this?",
  },
  {
    key: "developmentTime",
    label: "Speed to MVP",
    description: "Higher = faster to ship",
  },
  {
    key: "maintenanceComplexity",
    label: "Ops Simplicity",
    description: "Higher = lower ongoing burden",
  },
  {
    key: "viralityPotential",
    label: "Virality",
    description: "Organic spread and shareability",
  },
  {
    key: "creatorEconomyAlignment",
    label: "Creator Fit",
    description: "Alignment with creator workflows",
  },
  {
    key: "aiDefensibility",
    label: "AI Moat",
    description: "Defensibility against commodity AI",
  },
  {
    key: "nicheStrength",
    label: "Niche Depth",
    description: "Passionate underserved audience",
  },
];
