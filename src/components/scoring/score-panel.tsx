"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { computeWeightedScore, scoreLabel } from "@/lib/scoring";
import type { Concept, ScoreWeights } from "@/types/concept";
import { RadialScore } from "./radial-score";
import { ScoreBars } from "./score-bars";
import { ScoreHeatmap } from "./score-heatmap";

interface ScorePanelProps {
  concept: Concept;
  weights: ScoreWeights;
}

export function ScorePanel({ concept, weights }: ScorePanelProps) {
  const composite = computeWeightedScore(concept.scores, weights);
  const label = scoreLabel(composite);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-300">Viability Matrix</h3>
        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
          {label}
        </span>
      </div>

      <div className="mb-6 flex justify-center">
        <RadialScore value={composite} label="Composite" size={100} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <RadialScore value={concept.noveltyScore} label="Novelty" size={72} />
        <RadialScore
          value={concept.founderFitScore}
          label="Founder Fit"
          size={72}
        />
      </div>

      <Tabs defaultValue="bars" className="w-full">
        <TabsList className="mb-3 grid w-full grid-cols-2 bg-white/5">
          <TabsTrigger value="bars" className="text-xs">
            Spectrum
          </TabsTrigger>
          <TabsTrigger value="heat" className="text-xs">
            Heatmap
          </TabsTrigger>
        </TabsList>
        <TabsContent value="bars">
          <ScoreBars scores={concept.scores} />
        </TabsContent>
        <TabsContent value="heat">
          <ScoreHeatmap scores={concept.scores} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
