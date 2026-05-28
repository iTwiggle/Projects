"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { generateConceptsFromInput, mutateConcept } from "@/lib/concept-engine";
import { defaultIdeaInput } from "@/lib/defaults";
import { Concept, ConceptForgeState, IdeaInput, MutationMode } from "@/types/concept";

const STORAGE_KEY = "concept-forge-state-v1";

const initialState: ConceptForgeState = {
  ideaInput: defaultIdeaInput,
  concepts: [],
  selectedConceptId: null,
  comparisonConceptId: null,
};

export function useConceptForge() {
  const [state, setState] = useState<ConceptForgeState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as ConceptForgeState;
          setState(parsed);
        } catch {
          const seeded = generateConceptsFromInput(defaultIdeaInput, 3);
          setState((current) => ({
            ...current,
            concepts: seeded,
            selectedConceptId: seeded[0]?.id ?? null,
            comparisonConceptId: seeded[1]?.id ?? null,
          }));
        }
      } else {
        const seeded = generateConceptsFromInput(defaultIdeaInput, 3);
        setState((current) => ({
          ...current,
          concepts: seeded,
          selectedConceptId: seeded[0]?.id ?? null,
          comparisonConceptId: seeded[1]?.id ?? null,
        }));
      }
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const selectedConcept = useMemo(
    () => state.concepts.find((concept) => concept.id === state.selectedConceptId) ?? null,
    [state.concepts, state.selectedConceptId],
  );

  const comparisonConcept = useMemo(
    () =>
      state.concepts.find((concept) => concept.id === state.comparisonConceptId) ?? null,
    [state.comparisonConceptId, state.concepts],
  );

  const updateIdeaInput = useCallback((field: keyof IdeaInput, value: string) => {
    setState((current) => ({
      ...current,
      ideaInput: { ...current.ideaInput, [field]: value },
    }));
  }, []);

  const generateConcepts = useCallback(() => {
    setState((current) => {
      const generated = generateConceptsFromInput(current.ideaInput, 3);
      const concepts = [...generated, ...current.concepts];
      return {
        ...current,
        concepts,
        selectedConceptId: generated[0]?.id ?? current.selectedConceptId,
        comparisonConceptId: generated[1]?.id ?? current.comparisonConceptId,
      };
    });
  }, []);

  const selectConcept = useCallback((id: string) => {
    setState((current) => ({ ...current, selectedConceptId: id }));
  }, []);

  const selectComparisonConcept = useCallback((id: string) => {
    setState((current) => ({ ...current, comparisonConceptId: id }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      concepts: current.concepts.map((concept) =>
        concept.id === id ? { ...concept, favorite: !concept.favorite } : concept,
      ),
    }));
  }, []);

  const addTag = useCallback((id: string, tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) return;
    setState((current) => ({
      ...current,
      concepts: current.concepts.map((concept) => {
        if (concept.id !== id) return concept;
        if (concept.tags.includes(trimmed)) return concept;
        return { ...concept, tags: [...concept.tags, trimmed] };
      }),
    }));
  }, []);

  const mutateSelectedConcept = useCallback(
    (mode: MutationMode) => {
      setState((current) => {
        const base = current.concepts.find((concept) => concept.id === current.selectedConceptId);
        if (!base) return current;

        const comparison =
          mode === "combine"
            ? current.concepts.find((concept) => concept.id === current.comparisonConceptId) ??
              null
            : null;

        const mutated = mutateConcept(base, mode, comparison);
        return {
          ...current,
          concepts: [mutated, ...current.concepts],
          selectedConceptId: mutated.id,
        };
      });
    },
    [],
  );

  const conceptVersions = useCallback(
    (concept: Concept) =>
      state.concepts.filter((candidate) => candidate.parentId === concept.id).length,
    [state.concepts],
  );

  return {
    ready,
    state,
    selectedConcept,
    comparisonConcept,
    updateIdeaInput,
    generateConcepts,
    selectConcept,
    selectComparisonConcept,
    toggleFavorite,
    addTag,
    mutateSelectedConcept,
    conceptVersions,
  };
}
