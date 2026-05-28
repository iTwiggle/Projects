export type DifficultyLevel = "Low" | "Medium" | "High" | "Extreme";
export type SaturationLevel = "Open" | "Emerging" | "Crowded" | "Saturated";
export type MaintenanceBurden = "Light" | "Moderate" | "Heavy" | "Ops-Heavy";

export interface ConceptScores {
  originality: number;
  profitability: number;
  feasibility: number;
  developmentTime: number;
  maintenanceComplexity: number;
  viralityPotential: number;
  creatorEconomyAlignment: number;
  aiDefensibility: number;
  nicheStrength: number;
}

export interface ConceptInput {
  interests: string[];
  industries: string[];
  frustrations: string[];
  hobbies: string[];
  technologies: string[];
  skills: string[];
  randomConcepts: string[];
}

export interface Concept {
  id: string;
  name: string;
  pitch: string;
  problemSolved: string;
  targetAudience: string;
  uniqueAngle: string;
  monetization: string;
  technicalDifficulty: DifficultyLevel;
  maintenanceBurden: MaintenanceBurden;
  marketSaturation: SaturationLevel;
  noveltyScore: number;
  founderFitScore: number;
  mvpScope: string[];
  whyItCouldFail: string;
  hiddenOpportunity: string;
  mutationIdeas: string[];
  uiAesthetic: string;
  scores: ConceptScores;
  tags: string[];
  isFavorite: boolean;
  parentId?: string;
  mutationType?: MutationType;
  createdAt: string;
  updatedAt: string;
  sourceInputs: string[];
}

export type MutationType =
  | "remix"
  | "combine"
  | "evolve"
  | "cursed"
  | "profitable"
  | "simpler"
  | "scalable"
  | "b2b"
  | "creators"
  | "low-maintenance";

export interface ForgeState {
  inputs: ConceptInput;
  concepts: Concept[];
  activeConceptId: string | null;
  compareIds: string[];
  scoreWeights: ScoreWeights;
}

export interface ScoreWeights {
  originality: number;
  profitability: number;
  feasibility: number;
  developmentTime: number;
  maintenanceComplexity: number;
  viralityPotential: number;
  creatorEconomyAlignment: number;
  aiDefensibility: number;
  nicheStrength: number;
}

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  originality: 1.2,
  profitability: 1.1,
  feasibility: 1.0,
  developmentTime: 0.9,
  maintenanceComplexity: 0.85,
  viralityPotential: 0.95,
  creatorEconomyAlignment: 1.05,
  aiDefensibility: 0.9,
  nicheStrength: 1.15,
};

export const EMPTY_INPUTS: ConceptInput = {
  interests: [],
  industries: [],
  frustrations: [],
  hobbies: [],
  technologies: [],
  skills: [],
  randomConcepts: [],
};
