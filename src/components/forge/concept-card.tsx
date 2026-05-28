"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  Eye,
  GitBranch,
  Heart,
  Lightbulb,
  Palette,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Concept } from "@/types/concept";
import { GlassCard } from "./glass-card";

interface ConceptCardProps {
  concept: Concept;
  isActive?: boolean;
  isComparing?: boolean;
  onSelect?: () => void;
  onFavorite?: () => void;
  onDelete?: () => void;
  onCompare?: () => void;
  compact?: boolean;
}

const difficultyColors: Record<string, string> = {
  Low: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  Medium: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  High: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  Extreme: "text-rose-400 border-rose-500/30 bg-rose-500/10",
};

const saturationColors: Record<string, string> = {
  Open: "text-emerald-400",
  Emerging: "text-cyan-400",
  Crowded: "text-amber-400",
  Saturated: "text-rose-400",
};

export function ConceptCard({
  concept,
  isActive,
  isComparing,
  onSelect,
  onFavorite,
  onDelete,
  onCompare,
  compact = false,
}: ConceptCardProps) {
  const [expanded, setExpanded] = useState(!compact);

  return (
    <GlassCard
      glow={isActive ? "violet" : "none"}
      className={cn(
        "cursor-pointer overflow-hidden transition-all",
        isActive && "border-violet-500/40 ring-1 ring-violet-500/20",
        isComparing && "border-amber-500/40"
      )}
    >
      <div onClick={onSelect} className="p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-white">
                {concept.name}
              </h3>
              {concept.mutationType && (
                <Badge
                  variant="secondary"
                  className="border-violet-500/30 bg-violet-500/10 text-[10px] text-violet-300"
                >
                  <GitBranch className="mr-1 h-2.5 w-2.5" />
                  {concept.mutationType}
                </Badge>
              )}
            </div>
            <p className="line-clamp-2 text-sm text-zinc-400">{concept.pitch}</p>
          </div>
          <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-500 hover:text-rose-400"
              onClick={onFavorite}
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  concept.isFavorite && "fill-rose-400 text-rose-400"
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                isComparing ? "text-amber-400" : "text-zinc-500 hover:text-amber-400"
              )}
              onClick={onCompare}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-500 hover:text-zinc-300"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <Badge className={difficultyColors[concept.technicalDifficulty]}>
            {concept.technicalDifficulty}
          </Badge>
          <Badge variant="outline" className="border-white/10 text-zinc-400">
            {concept.maintenanceBurden} ops
          </Badge>
          <span
            className={cn(
              "text-xs font-medium",
              saturationColors[concept.marketSaturation]
            )}
          >
            {concept.marketSaturation} market
          </span>
        </div>

        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-lg font-bold tabular-nums text-cyan-400">
              {concept.noveltyScore}
            </div>
            <div className="text-[10px] uppercase text-zinc-600">Novelty</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold tabular-nums text-violet-400">
              {concept.founderFitScore}
            </div>
            <div className="text-[10px] uppercase text-zinc-600">Fit</div>
          </div>
          <div className="flex flex-1 flex-wrap gap-1 content-center">
            {concept.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-500"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
        >
          {expanded ? "Collapse" : "Expand intel"}
          <ChevronDown
            className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")}
          />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="space-y-4 p-4 sm:p-5 pt-0">
              <Section icon={Lightbulb} title="Problem Solved" accent="cyan">
                {concept.problemSolved}
              </Section>
              <Section icon={Sparkles} title="Unique Angle" accent="violet">
                {concept.uniqueAngle}
              </Section>
              <div className="grid gap-4 sm:grid-cols-2">
                <Section title="Target Audience">{concept.targetAudience}</Section>
                <Section title="Monetization">{concept.monetization}</Section>
              </div>
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  MVP Scope
                </h4>
                <ul className="space-y-1">
                  {concept.mvpScope.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-zinc-400"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <InsightBox
                  variant="danger"
                  icon={AlertTriangle}
                  title="Why It Could Fail"
                  content={concept.whyItCouldFail}
                />
                <InsightBox
                  variant="success"
                  icon={Lightbulb}
                  title="Hidden Opportunity"
                  content={concept.hiddenOpportunity}
                />
              </div>
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Mutation Ideas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {concept.mutationIdeas.map((idea) => (
                    <span
                      key={idea}
                      className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-2 py-1 text-xs text-violet-300/80"
                    >
                      {idea}
                    </span>
                  ))}
                </div>
              </div>
              <Section icon={Palette} title="UI Aesthetic" accent="amber">
                {concept.uiAesthetic}
              </Section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

function Section({
  title,
  children,
  icon: Icon,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <div>
      <h4 className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
        {Icon && (
          <Icon
            className={cn(
              "h-3 w-3",
              accent === "cyan" && "text-cyan-400",
              accent === "violet" && "text-violet-400",
              accent === "amber" && "text-amber-400"
            )}
          />
        )}
        {title}
      </h4>
      <p className="text-sm leading-relaxed text-zinc-400">{children}</p>
    </div>
  );
}

function InsightBox({
  title,
  content,
  icon: Icon,
  variant,
}: {
  title: string;
  content: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: "danger" | "success";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        variant === "danger"
          ? "border-rose-500/20 bg-rose-500/5"
          : "border-emerald-500/20 bg-emerald-500/5"
      )}
    >
      <h4
        className={cn(
          "mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider",
          variant === "danger" ? "text-rose-400" : "text-emerald-400"
        )}
      >
        <Icon className="h-3 w-3" />
        {title}
      </h4>
      <p className="text-sm text-zinc-400">{content}</p>
    </div>
  );
}
