"use client";

import { motion } from "framer-motion";
import { useForge } from "@/hooks/use-forge";
import { ForgeBackground } from "@/components/layout/forge-background";
import { Header } from "@/components/layout/header";
import { IdeaInputPanel } from "./idea-input-panel";
import { ConceptList } from "./concept-list";
import { MutationPanel } from "./mutation-panel";
import { ScorePanel } from "@/components/scoring/score-panel";
import { ComparePanel } from "./compare-panel";

export function ForgeWorkspace() {
  const forge = useForge();

  if (!forge.hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06060b]">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-sm text-cyan-400/80"
        >
          Initializing reactor…
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <ForgeBackground />
      <Header savedCount={forge.savedCount} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center sm:text-left"
        >
          <h1 className="bg-gradient-to-r from-cyan-200 via-white to-violet-200 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Refine fragments into strategic software concepts
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500 sm:text-base">
            Not another idea generator — a systems-thinking forge that scores
            viability, mutates DNA, and surfaces what competitors missed.
          </p>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="sticky top-20">
              <IdeaInputPanel
                inputs={forge.inputs}
                onChange={forge.updateInputs}
                onGenerate={forge.generate}
                isGenerating={forge.isGenerating}
              />
            </div>
          </div>

          <div className="space-y-4 lg:col-span-5">
            {forge.compareConcepts.length === 2 && (
              <ComparePanel
                concepts={forge.compareConcepts}
                weights={forge.scoreWeights}
              />
            )}
            <ConceptList
              concepts={forge.concepts}
              activeConceptId={forge.activeConceptId}
              compareIds={forge.compareIds}
              onSelect={forge.setActiveConceptId}
              onFavorite={forge.toggleFavorite}
              onDelete={forge.deleteConcept}
              onCompare={forge.toggleCompare}
            />
          </div>

          <div className="space-y-4 lg:col-span-4">
            <div className="sticky top-20 space-y-4">
              {forge.activeConcept && (
                <motion.div
                  key={forge.activeConcept.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <ScorePanel
                    concept={forge.activeConcept}
                    weights={forge.scoreWeights}
                  />
                </motion.div>
              )}
              <MutationPanel
                activeConcept={forge.activeConcept}
                concepts={forge.concepts}
                onMutate={forge.mutate}
                onCombine={forge.combine}
                isMutating={forge.isMutating}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
