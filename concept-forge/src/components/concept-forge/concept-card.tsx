"use client";

import { useState } from "react";

import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Layers, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Concept } from "@/types/concept";

interface ConceptCardProps {
  concept: Concept;
  isSelected: boolean;
  childCount: number;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onAddTag: (tag: string) => void;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-2">
      <p className="text-[10px] tracking-wide text-zinc-500 uppercase">{label}</p>
      <p className="mt-1 text-xs text-zinc-200">{value}</p>
    </div>
  );
}

export function ConceptCard({
  concept,
  isSelected,
  childCount,
  onSelect,
  onToggleFavorite,
  onAddTag,
}: ConceptCardProps) {
  const [tagDraft, setTagDraft] = useState("");

  const submitTag = () => {
    onAddTag(tagDraft);
    setTagDraft("");
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card
        className={`border bg-card/70 backdrop-blur-xl transition-all ${
          isSelected
            ? "border-cyan-300/50 shadow-[0_0_45px_-26px_rgba(34,211,238,1)]"
            : "border-zinc-800/90"
        }`}
      >
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base text-zinc-100">{concept.name}</CardTitle>
              <CardDescription className="text-zinc-300">{concept.oneLinePitch}</CardDescription>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleFavorite}
              className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              {concept.favorite ? (
                <BookmarkCheck className="h-4 w-4 text-cyan-300" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-zinc-700 text-zinc-300">
              v{concept.version}
            </Badge>
            <Badge variant="outline" className="border-cyan-400/40 text-cyan-200">
              Weighted {concept.weightedScore}
            </Badge>
            <Badge variant="outline" className="border-fuchsia-400/40 text-fuchsia-200">
              Iterations {childCount}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Stat label="Problem Solved" value={concept.problemSolved} />
            <Stat label="Target Audience" value={concept.targetAudience} />
            <Stat label="Unique Angle" value={concept.uniqueAngle} />
            <Stat label="Monetization" value={concept.monetizationStrategy} />
            <Stat label="Tech Difficulty" value={concept.technicalDifficulty} />
            <Stat label="Maintenance Burden" value={concept.maintenanceBurden} />
            <Stat label="Market Saturation" value={concept.marketSaturationEstimate} />
            <Stat label="UI Aesthetic" value={concept.suggestedUiAesthetic} />
          </div>

          <Separator className="bg-zinc-800" />

          <div className="grid gap-2 sm:grid-cols-2">
            <Stat label="Novelty Score" value={concept.noveltyScore} />
            <Stat label="Founder-fit Score" value={concept.founderFitScore} />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-[10px] tracking-wide text-zinc-500 uppercase">MVP Scope</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-zinc-300">
              {concept.mvpScope.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-rose-400/20 bg-rose-950/20 p-3">
              <p className="flex items-center gap-2 text-[10px] tracking-wide text-rose-200 uppercase">
                <TriangleAlert className="h-3 w-3" />
                Why this could fail
              </p>
              <p className="mt-1 text-xs text-zinc-200">{concept.whyThisCouldFail}</p>
            </div>
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-950/20 p-3">
              <p className="text-[10px] tracking-wide text-emerald-200 uppercase">
                Hidden opportunity
              </p>
              <p className="mt-1 text-xs text-zinc-200">{concept.hiddenOpportunity}</p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-[10px] tracking-wide text-zinc-500 uppercase">Mutation ideas</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-zinc-300">
              {concept.mutationIdeas.map((idea) => (
                <li key={idea}>{idea}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {concept.tags.map((tag) => (
                <Badge key={tag} className="bg-zinc-800 text-zinc-200">
                  #{tag}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagDraft}
                onChange={(event) => setTagDraft(event.target.value)}
                placeholder="Add tag"
                className="border-zinc-700 bg-zinc-950/60 text-zinc-100 placeholder:text-zinc-500"
              />
              <Button variant="secondary" onClick={submitTag} className="bg-zinc-800 text-zinc-200">
                <Layers className="mr-2 h-4 w-4" />
                Tag
              </Button>
            </div>
          </div>

          <Button
            variant={isSelected ? "default" : "outline"}
            onClick={onSelect}
            className={
              isSelected
                ? "w-full border border-cyan-300/50 bg-cyan-300/20 text-cyan-100 hover:bg-cyan-300/35"
                : "w-full border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
            }
          >
            {isSelected ? "Selected for Mutation" : "Select Concept"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
