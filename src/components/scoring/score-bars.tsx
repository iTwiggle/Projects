"use client";

import { motion } from "framer-motion";
import { scoreColor } from "@/lib/scoring";
import type { ConceptScores } from "@/types/concept";
import { SCORE_DIMENSIONS } from "@/lib/scoring";

interface ScoreBarsProps {
  scores: ConceptScores;
}

export function ScoreBars({ scores }: ScoreBarsProps) {
  return (
    <div className="space-y-3">
      {SCORE_DIMENSIONS.map((dim, i) => {
        const value = scores[dim.key];
        const color = scoreColor(value);
        return (
          <div key={dim.key} className="group">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-zinc-400 group-hover:text-zinc-300">
                {dim.label}
              </span>
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color }}
              >
                {value}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${color}, ${color}88)`,
                  boxShadow: `0 0 12px ${color}44`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
