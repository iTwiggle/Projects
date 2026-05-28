"use client";

import { AnimatePresence } from "framer-motion";

import { ConceptCard } from "@/components/concept-forge/concept-card";
import { ConceptLibrary } from "@/components/concept-forge/concept-library";
import { ForgeHeader } from "@/components/concept-forge/forge-header";
import { IdeaInputPanel } from "@/components/concept-forge/idea-input-panel";
import { MutationLab } from "@/components/concept-forge/mutation-lab";
import { ScoreVisualizations } from "@/components/concept-forge/score-visualizations";
import { useConceptForge } from "@/hooks/use-concept-forge";

export default function Home() {
  const {
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
  } = useConceptForge();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#07090f] px-4 py-5 text-zinc-100 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_8%,rgba(56,189,248,0.16),transparent_35%),radial-gradient(circle_at_94%_3%,rgba(217,70,239,0.13),transparent_33%),radial-gradient(circle_at_72%_88%,rgba(16,185,129,0.12),transparent_30%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-4">
        <ForgeHeader />

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <IdeaInputPanel
            value={state.ideaInput}
            onChange={updateIdeaInput}
            onGenerate={generateConcepts}
          />
          <MutationLab
            selectedConcept={selectedConcept}
            concepts={state.concepts}
            comparisonConceptId={state.comparisonConceptId}
            onSelectComparisonConcept={selectComparisonConcept}
            onMutate={mutateSelectedConcept}
          />
        </section>

        {!ready ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-zinc-400">
            Initializing Concept Forge reactor core...
          </div>
        ) : (
          <section className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
            <div className="space-y-4">
              {selectedConcept ? <ScoreVisualizations concept={selectedConcept} /> : null}

              <AnimatePresence mode="popLayout">
                <div className="grid gap-3">
                  {state.concepts.slice(0, 6).map((concept) => (
                    <ConceptCard
                      key={concept.id}
                      concept={concept}
                      childCount={conceptVersions(concept)}
                      isSelected={state.selectedConceptId === concept.id}
                      onSelect={() => selectConcept(concept.id)}
                      onToggleFavorite={() => toggleFavorite(concept.id)}
                      onAddTag={(tag) => addTag(concept.id, tag)}
                    />
                  ))}
                </div>
              </AnimatePresence>
            </div>

            <div className="space-y-4">
              <ConceptLibrary
                concepts={state.concepts}
                selectedConceptId={state.selectedConceptId}
                comparisonConceptId={state.comparisonConceptId}
                onSelectConcept={selectConcept}
                onSelectComparisonConcept={selectComparisonConcept}
              />

              {comparisonConcept ? (
                <div className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-500/10 p-4">
                  <p className="text-xs tracking-wide text-fuchsia-100 uppercase">
                    Comparison target
                  </p>
                  <p className="mt-1 text-sm text-zinc-100">{comparisonConcept.name}</p>
                  <p className="mt-2 text-xs text-zinc-300">
                    Novelty {comparisonConcept.noveltyScore} · Fit {comparisonConcept.founderFitScore}
                    {" · "}Weighted {comparisonConcept.weightedScore}
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
