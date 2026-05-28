"use client";

import { Clock3, FolderHeart, GitCompareArrows } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Concept } from "@/types/concept";

interface ConceptLibraryProps {
  concepts: Concept[];
  selectedConceptId: string | null;
  comparisonConceptId: string | null;
  onSelectConcept: (id: string) => void;
  onSelectComparisonConcept: (id: string) => void;
}

export function ConceptLibrary({
  concepts,
  selectedConceptId,
  comparisonConceptId,
  onSelectConcept,
  onSelectComparisonConcept,
}: ConceptLibraryProps) {
  const ordered = [...concepts].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });

  return (
    <Card className="border-zinc-800/90 bg-card/70 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100">
          <FolderHeart className="h-5 w-5 text-cyan-300" />
          Concept Vault
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Saved concepts, tags, favorites, and comparison selection.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-zinc-500">
          Total concepts: <span className="text-zinc-200">{concepts.length}</span>
        </p>
        <div className="space-y-2">
          {ordered.slice(0, 10).map((concept) => (
            <div
              key={concept.id}
              className={`rounded-xl border p-3 ${
                concept.id === selectedConceptId
                  ? "border-cyan-400/50 bg-cyan-500/10"
                  : "border-zinc-800 bg-zinc-950/55"
              }`}
            >
              <button
                onClick={() => onSelectConcept(concept.id)}
                className="w-full text-left"
                type="button"
              >
                <p className="line-clamp-1 text-sm text-zinc-100">{concept.name}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                  <Clock3 className="h-3 w-3" />
                  {new Date(concept.createdAt).toLocaleTimeString()}
                </div>
              </button>

              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                  v{concept.version}
                </Badge>
                <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                  score {concept.weightedScore}
                </Badge>
                {concept.favorite ? (
                  <Badge variant="outline" className="border-cyan-400/50 text-cyan-200">
                    favorite
                  </Badge>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => onSelectComparisonConcept(concept.id)}
                className={`mt-2 flex w-full items-center justify-center gap-2 rounded-md border px-2 py-1 text-xs ${
                  concept.id === comparisonConceptId
                    ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-100"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300"
                }`}
              >
                <GitCompareArrows className="h-3 w-3" />
                {concept.id === comparisonConceptId ? "Comparison target" : "Set as comparison"}
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
