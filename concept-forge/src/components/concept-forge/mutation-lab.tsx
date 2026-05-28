"use client";

import { motion } from "framer-motion";
import { GitMerge, FlaskConical, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Concept, MutationMode } from "@/types/concept";

interface MutationLabProps {
  selectedConcept: Concept | null;
  concepts: Concept[];
  comparisonConceptId: string | null;
  onSelectComparisonConcept: (id: string) => void;
  onMutate: (mode: MutationMode) => void;
}

const growthModes: MutationMode[] = [
  "profitable",
  "scalable",
  "pivotB2B",
  "pivotCreators",
];

const experimentalModes: MutationMode[] = ["remix", "adjacent", "cursed", "simpler"];

export function MutationLab({
  selectedConcept,
  concepts,
  comparisonConceptId,
  onSelectComparisonConcept,
  onMutate,
}: MutationLabProps) {
  if (!selectedConcept) return null;

  return (
    <Card className="border-fuchsia-400/25 bg-card/70 shadow-[0_0_40px_-26px_rgba(217,70,239,0.95)] backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-fuchsia-100">
          <FlaskConical className="h-5 w-5 text-fuchsia-300" />
          Mutation Engine
        </CardTitle>
        <CardDescription className="text-zinc-300">
          Evolve the selected concept through guided strategic mutations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Tabs defaultValue="growth" className="w-full">
          <TabsList className="w-full bg-zinc-900/70">
            <TabsTrigger value="growth" className="flex-1">
              Growth Mutations
            </TabsTrigger>
            <TabsTrigger value="experimental" className="flex-1">
              Experimental Mutations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="growth" className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {growthModes.map((mode) => (
                <Button
                  key={mode}
                  variant="outline"
                  onClick={() => onMutate(mode)}
                  className="border-zinc-700 bg-zinc-900/80 text-zinc-100 capitalize hover:bg-zinc-800"
                >
                  {mode}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="experimental" className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {experimentalModes.map((mode) => (
                <Button
                  key={mode}
                  variant="outline"
                  onClick={() => onMutate(mode)}
                  className="border-zinc-700 bg-zinc-900/80 text-zinc-100 capitalize hover:bg-zinc-800"
                >
                  {mode}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
          <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
            Mutation intensity (visual only in MVP)
          </p>
          <Slider defaultValue={[68]} min={10} max={100} step={1} />
          <p className="text-xs text-zinc-500">
            Future release: intensity adjusts score delta aggressiveness and volatility.
          </p>
        </div>

        <div className="space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
              Recombination
            </p>
            <GitMerge className="h-4 w-4 text-zinc-500" />
          </div>
          <select
            value={comparisonConceptId ?? ""}
            onChange={(event) => onSelectComparisonConcept(event.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-zinc-100"
          >
            {concepts
              .filter((concept) => concept.id !== selectedConcept.id)
              .map((concept) => (
                <option key={concept.id} value={concept.id}>
                  {concept.name}
                </option>
              ))}
          </select>
          <Button
            onClick={() => onMutate("combine")}
            className="w-full border border-fuchsia-300/50 bg-fuchsia-300/15 text-fuchsia-100 hover:bg-fuchsia-300/30"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Combine Concepts
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-zinc-700/80 bg-zinc-900/40 p-3"
        >
          <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
            Selected concept
          </p>
          <p className="mt-1 text-sm text-zinc-200">{selectedConcept.name}</p>
          <p className="mt-1 text-xs text-zinc-400">Version {selectedConcept.version}</p>
        </motion.div>
      </CardContent>
    </Card>
  );
}
