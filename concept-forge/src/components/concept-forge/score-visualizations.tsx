"use client";

import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Concept, ScoreDimension } from "@/types/concept";

interface ScoreVisualizationsProps {
  concept: Concept;
}

const labels: Record<ScoreDimension, string> = {
  originality: "Originality",
  profitability: "Profitability",
  feasibility: "Feasibility",
  developmentTime: "Development Time",
  maintenanceComplexity: "Maintenance Complexity",
  viralityPotential: "Virality Potential",
  creatorEconomyAlignment: "Creator Alignment",
  aiDefensibility: "AI Defensibility",
  nicheStrength: "Niche Strength",
};

function scoreTone(value: number) {
  if (value >= 75) return "from-emerald-400/70 to-cyan-300/70";
  if (value >= 50) return "from-amber-300/70 to-cyan-300/70";
  return "from-rose-400/70 to-amber-300/60";
}

function RadialMeter({ label, value }: { label: string; value: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const stroke = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle cx="40" cy="40" r={radius} strokeWidth={8} className="fill-none stroke-zinc-800" />
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          strokeWidth={8}
          strokeLinecap="round"
          className="fill-none stroke-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
          style={{ strokeDasharray: circumference, strokeDashoffset: stroke }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: stroke }}
          transition={{ duration: 0.6 }}
        />
      </svg>
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

export function ScoreVisualizations({ concept }: ScoreVisualizationsProps) {
  const heatmapValues = [
    concept.scores.originality,
    concept.scores.profitability,
    concept.scores.feasibility,
    concept.scores.viralityPotential,
    concept.scores.aiDefensibility,
    concept.scores.nicheStrength,
    concept.scores.creatorEconomyAlignment,
    100 - concept.scores.developmentTime,
    100 - concept.scores.maintenanceComplexity,
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Card className="border-cyan-400/20 bg-card/65 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-cyan-100">Scoring Core</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-3 gap-2">
            <RadialMeter label="Weighted" value={concept.weightedScore} />
            <RadialMeter label="Novelty" value={concept.noveltyScore} />
            <RadialMeter label="Founder Fit" value={concept.founderFitScore} />
          </div>

          <div className="space-y-2">
            {(Object.keys(concept.scores) as ScoreDimension[]).map((dimension) => (
              <div key={dimension} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">{labels[dimension]}</span>
                  <span className="text-zinc-400">{concept.scores[dimension]}</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${concept.scores[dimension]}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-2 rounded-full bg-gradient-to-r ${scoreTone(concept.scores[dimension])}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-400/20 bg-card/65 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-fuchsia-100">Signal Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {heatmapValues.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="rounded-lg border border-zinc-800 p-3 text-center"
                style={{
                  background:
                    value > 72
                      ? "radial-gradient(circle at top, rgba(16,185,129,0.35), rgba(10,10,10,0.85))"
                      : value > 48
                        ? "radial-gradient(circle at top, rgba(245,158,11,0.30), rgba(10,10,10,0.85))"
                        : "radial-gradient(circle at top, rgba(244,63,94,0.30), rgba(10,10,10,0.85))",
                }}
              >
                <p className="text-xs text-zinc-400">node {index + 1}</p>
                <p className="text-sm font-semibold text-zinc-100">{value}</p>
              </motion.div>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Heatmap blends growth, defensibility, and complexity pressure into quick strategic
            signal nodes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
