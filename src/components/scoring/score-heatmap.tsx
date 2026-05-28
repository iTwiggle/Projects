"use client";

import { motion } from "framer-motion";
import type { ConceptScores } from "@/types/concept";
import { SCORE_DIMENSIONS } from "@/lib/scoring";

interface ScoreHeatmapProps {
  scores: ConceptScores;
}

function heatColor(value: number): string {
  if (value >= 80) return "rgba(52, 211, 153, 0.85)";
  if (value >= 60) return "rgba(34, 211, 238, 0.75)";
  if (value >= 40) return "rgba(251, 191, 36, 0.7)";
  return "rgba(251, 113, 133, 0.65)";
}

export function ScoreHeatmap({ scores }: ScoreHeatmapProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-3">
      {SCORE_DIMENSIONS.map((dim, i) => {
        const value = scores[dim.key];
        return (
          <motion.div
            key={dim.key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            className="group relative flex aspect-square flex-col items-center justify-center rounded-lg border border-white/5 p-2 transition-colors hover:border-white/10"
            style={{
              background: `linear-gradient(135deg, ${heatColor(value)}22, transparent)`,
            }}
            title={`${dim.label}: ${value} — ${dim.description}`}
          >
            <span
              className="text-lg font-bold tabular-nums text-white"
              style={{ textShadow: `0 0 20px ${heatColor(value)}` }}
            >
              {value}
            </span>
            <span className="mt-0.5 text-center text-[9px] leading-tight text-zinc-500 group-hover:text-zinc-400">
              {dim.label.split(" ")[0]}
            </span>
            <div
              className="absolute inset-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
              style={{
                boxShadow: `inset 0 0 20px ${heatColor(value)}33`,
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
