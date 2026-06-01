"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { generateConcepts, delay } from "@/lib/concept-generator";
import {
  combineConcepts,
  finalizeConcept,
  mutateConcept,
} from "@/lib/mutation-engine";
import { loadState, saveState } from "@/lib/storage";
import type {
  Concept,
  ConceptInput,
  MutationType,
  ScoreWeights,
} from "@/types/concept";
import { DEFAULT_SCORE_WEIGHTS, EMPTY_INPUTS } from "@/types/concept";

export function useForge() {
  const [inputs, setInputs] = useState<ConceptInput>(EMPTY_INPUTS);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [activeConceptId, setActiveConceptId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [scoreWeights, setScoreWeights] =
    useState<ScoreWeights>(DEFAULT_SCORE_WEIGHTS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const skipNextSaveRef = useRef(true);

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      queueMicrotask(() => {
        setInputs(saved.inputs);
        setConcepts(saved.concepts);
        setScoreWeights(saved.scoreWeights);
      });
    }
    queueMicrotask(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    saveState({ inputs, concepts, scoreWeights });
  }, [inputs, concepts, scoreWeights, hydrated]);

  const activeConcept =
    concepts.find((c) => c.id === activeConceptId) ?? concepts[0] ?? null;

  const generate = useCallback(async () => {
    setIsGenerating(true);
    await delay(1200 + Math.random() * 800);
    const generated = generateConcepts(inputs, 3);
    setConcepts((prev) => [...generated, ...prev]);
    setActiveConceptId(generated[0]?.id ?? null);
    setIsGenerating(false);
  }, [inputs]);

  const mutate = useCallback(
    async (type: MutationType, conceptId?: string) => {
      const target = conceptId
        ? concepts.find((c) => c.id === conceptId)
        : activeConcept;
      if (!target) return;

      setIsMutating(true);
      await delay(600 + Math.random() * 400);
      const mutated = mutateConcept(target, type);
      setConcepts((prev) => [mutated, ...prev]);
      setActiveConceptId(mutated.id);
      setIsMutating(false);
    },
    [concepts, activeConcept]
  );

  const combine = useCallback(
    async (idA: string, idB: string) => {
      const a = concepts.find((c) => c.id === idA);
      const b = concepts.find((c) => c.id === idB);
      if (!a || !b) return;

      setIsMutating(true);
      await delay(800);
      const fused = finalizeConcept(combineConcepts(a, b));
      setConcepts((prev) => [fused, ...prev]);
      setActiveConceptId(fused.id);
      setIsMutating(false);
    },
    [concepts]
  );

  const toggleFavorite = useCallback((id: string) => {
    setConcepts((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isFavorite: !c.isFavorite, updatedAt: new Date().toISOString() } : c
      )
    );
  }, []);

  const deleteConcept = useCallback((id: string) => {
    setConcepts((prev) => prev.filter((c) => c.id !== id));
    setActiveConceptId((current) => (current === id ? null : current));
    setCompareIds((prev) => prev.filter((cid) => cid !== id));
  }, []);

  const addTag = useCallback((id: string, tag: string) => {
    const normalized = tag.trim().toLowerCase();
    if (!normalized) return;
    setConcepts((prev) =>
      prev.map((c) =>
        c.id === id && !c.tags.includes(normalized)
          ? {
              ...c,
              tags: [...c.tags, normalized],
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  }, []);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((cid) => cid !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }, []);

  const updateInputs = useCallback((patch: Partial<ConceptInput>) => {
    setInputs((prev) => ({ ...prev, ...patch }));
  }, []);

  return {
    inputs,
    concepts,
    activeConcept,
    activeConceptId,
    setActiveConceptId,
    compareIds,
    compareConcepts: concepts.filter((c) => compareIds.includes(c.id)),
    scoreWeights,
    setScoreWeights,
    isGenerating,
    isMutating,
    hydrated,
    generate,
    mutate,
    combine,
    toggleFavorite,
    deleteConcept,
    addTag,
    toggleCompare,
    updateInputs,
    savedCount: concepts.filter((c) => c.isFavorite).length,
  };
}
