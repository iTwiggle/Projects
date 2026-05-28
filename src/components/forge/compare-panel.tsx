"use client";

import { motion } from "framer-motion";
import { GitCompare } from "lucide-react";
import { computeWeightedScore } from "@/lib/scoring";
import type { Concept, ScoreWeights } from "@/types/concept";
import { SCORE_DIMENSIONS } from "@/lib/scoring";
import { GlassCard } from "./glass-card";

interface ComparePanelProps {
  concepts: Concept[];
  weights: ScoreWeights;
}

export function ComparePanel({ concepts, weights }: ComparePanelProps) {
  if (concepts.length < 2) return null;

  const [a, b] = concepts;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <GlassCard className="p-4" glow="amber">
        <div className="mb-4 flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Concept Duel</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[a, b].map((concept) => (
            <div key={concept.id}>
              <p className="mb-2 truncate text-sm font-medium text-white">
                {concept.name}
              </p>
              <p className="mb-3 text-2xl font-bold text-amber-400">
                {computeWeightedScore(concept.scores, weights)}
                <span className="ml-1 text-xs font-normal text-zinc-500">
                  composite
                </span>
              </p>
              <div className="space-y-1">
                {SCORE_DIMENSIONS.slice(0, 5).map((dim) => (
                  <div
                    key={dim.key}
                    className="flex justify-between text-xs"
                  >
                    <span className="text-zinc-500">{dim.label}</span>
                    <span className="font-mono text-zinc-300">
                      {concept.scores[dim.key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}
