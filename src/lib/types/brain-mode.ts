import type { DealAnalysis, DealInput, GoblinVerdict } from "@/lib/types/deal";

export const BRAIN_MODE_IDS = [
  "more_profitable",
  "faster_flip",
  "part_out",
  "worst_case",
  "hidden_opportunity",
] as const;

export type BrainModeId = (typeof BRAIN_MODE_IDS)[number];

export interface BrainModeDefinition {
  id: BrainModeId;
  label: string;
  shortLabel: string;
  goblinName: string;
  title: string;
  emoji: string;
  tagline: string;
  accent: "emerald" | "sky" | "amber" | "rose" | "violet";
}

export interface BrainModeResult {
  mode: BrainModeDefinition;
  adjustedInput: DealInput;
  analysis: DealAnalysis;
  verdict: GoblinVerdict;
  perspective: string[];
  adjustments: string[];
}

export const BRAIN_MODES: Record<BrainModeId, BrainModeDefinition> = {
  more_profitable: {
    id: "more_profitable",
    label: "More Profitable",
    shortLabel: "Profit",
    goblinName: "Grik the Hoarder",
    title: "Margin Maximizer",
    emoji: "💰",
    tagline: "Every copper counts. Negotiate hard, sell high.",
    accent: "emerald",
  },
  faster_flip: {
    id: "faster_flip",
    label: "Faster Flip",
    shortLabel: "Speed",
    goblinName: "Zip the Sprinter",
    title: "Quick-Cash Specialist",
    emoji: "⚡",
    tagline: "Cash in hand beats margin on paper.",
    accent: "sky",
  },
  part_out: {
    id: "part_out",
    label: "Part Out",
    shortLabel: "Parts",
    goblinName: "Wrench the Breaker",
    title: "Scrap & Salvage Goblin",
    emoji: "🔧",
    tagline: "The whole is worth less than its pieces.",
    accent: "amber",
  },
  worst_case: {
    id: "worst_case",
    label: "Worst Case Scenario",
    shortLabel: "Worst Case",
    goblinName: "Murk the Gloomy",
    title: "Disaster Planner",
    emoji: "🌧️",
    tagline: "Hope for gold, plan for gravel.",
    accent: "rose",
  },
  hidden_opportunity: {
    id: "hidden_opportunity",
    label: "Hidden Opportunity",
    shortLabel: "Hidden",
    goblinName: "Glimmer the Seer",
    title: "Niche Market Oracle",
    emoji: "🔮",
    tagline: "Others see junk. I see angles they missed.",
    accent: "violet",
  },
};
