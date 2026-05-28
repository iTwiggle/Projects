export type ScoreDimension =
  | "originality"
  | "profitability"
  | "feasibility"
  | "developmentTime"
  | "maintenanceComplexity"
  | "viralityPotential"
  | "creatorEconomyAlignment"
  | "aiDefensibility"
  | "nicheStrength";

export type MutationMode =
  | "remix"
  | "combine"
  | "cursed"
  | "profitable"
  | "simpler"
  | "scalable"
  | "pivotB2B"
  | "pivotCreators"
  | "reduceMaintenance"
  | "adjacent";

export type ScoreMap = Record<ScoreDimension, number>;

export interface IdeaInput {
  interests: string;
  industries: string;
  frustrations: string;
  hobbies: string;
  technologies: string;
  skills: string;
  randomConcepts: string;
}

export interface Concept {
  id: string;
  version: number;
  parentId: string | null;
  name: string;
  oneLinePitch: string;
  problemSolved: string;
  targetAudience: string;
  uniqueAngle: string;
  monetizationStrategy: string;
  technicalDifficulty: string;
  maintenanceBurden: string;
  marketSaturationEstimate: string;
  noveltyScore: number;
  founderFitScore: number;
  mvpScope: string[];
  whyThisCouldFail: string;
  hiddenOpportunity: string;
  mutationIdeas: string[];
  suggestedUiAesthetic: string;
  scores: ScoreMap;
  weightedScore: number;
  tags: string[];
  favorite: boolean;
  mutationHistory: string[];
  createdAt: string;
}

export interface ConceptForgeState {
  ideaInput: IdeaInput;
  concepts: Concept[];
  selectedConceptId: string | null;
  comparisonConceptId: string | null;
}
