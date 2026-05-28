import type { Concept, ConceptInput, ForgeState, ScoreWeights } from "@/types/concept";
import { DEFAULT_SCORE_WEIGHTS, EMPTY_INPUTS } from "@/types/concept";

const STORAGE_KEY = "concept-forge-state-v1";

export interface PersistedState {
  inputs: ConceptInput;
  concepts: Concept[];
  scoreWeights: ScoreWeights;
}

export function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded — silently fail for MVP
  }
}

export function getDefaultForgeState(): ForgeState {
  return {
    inputs: EMPTY_INPUTS,
    concepts: [],
    activeConceptId: null,
    compareIds: [],
    scoreWeights: DEFAULT_SCORE_WEIGHTS,
  };
}

export function exportConcepts(concepts: Concept[]): string {
  return JSON.stringify(concepts, null, 2);
}
