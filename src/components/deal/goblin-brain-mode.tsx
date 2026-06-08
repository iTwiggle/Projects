"use client";

import { Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BRAIN_MODE_IDS,
  BRAIN_MODES,
  type BrainModeId,
  type BrainModeResult,
} from "@/lib/types/brain-mode";
import { cn } from "@/lib/utils";

interface GoblinBrainModeProps {
  activeMode: BrainModeId | null;
  onModeChange: (mode: BrainModeId | null) => void;
  result: BrainModeResult | null;
}

const accentStyles = {
  emerald: {
    ring: "ring-emerald-500/50",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/40",
    glow: "shadow-emerald-500/10",
  },
  sky: {
    ring: "ring-sky-500/50",
    bg: "bg-sky-500/15",
    text: "text-sky-400",
    border: "border-sky-500/40",
    glow: "shadow-sky-500/10",
  },
  amber: {
    ring: "ring-amber-500/50",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/40",
    glow: "shadow-amber-500/10",
  },
  rose: {
    ring: "ring-rose-500/50",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/40",
    glow: "shadow-rose-500/10",
  },
  violet: {
    ring: "ring-violet-500/50",
    bg: "bg-violet-500/15",
    text: "text-violet-400",
    border: "border-violet-500/40",
    glow: "shadow-violet-500/10",
  },
};

export function GoblinBrainMode({
  activeMode,
  onModeChange,
  result,
}: GoblinBrainModeProps) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="size-5 text-violet-400" aria-hidden />
          Goblin Brain Mode
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Consult a specialist goblin. Tap again to return to standard analysis.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {BRAIN_MODE_IDS.map((modeId) => {
            const mode = BRAIN_MODES[modeId];
            const style = accentStyles[mode.accent];
            const isActive = activeMode === modeId;

            return (
              <button
                key={modeId}
                type="button"
                onClick={() => onModeChange(isActive ? null : modeId)}
                className={cn(
                  "flex min-w-[7.5rem] shrink-0 flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  isActive
                    ? cn(style.border, style.bg, "ring-2", style.ring, "shadow-lg", style.glow)
                    : "border-border/50 bg-background/40 hover:border-border"
                )}
              >
                <span className="text-lg" aria-hidden>
                  {mode.emoji}
                </span>
                <span className={cn("text-xs font-semibold", isActive && style.text)}>
                  {mode.shortLabel}
                </span>
                <span className="text-[10px] leading-tight text-muted-foreground line-clamp-2">
                  {mode.goblinName}
                </span>
              </button>
            );
          })}
        </div>

        {result && (
          <div
            className={cn(
              "animate-in fade-in slide-in-from-bottom-1 rounded-xl border p-4 duration-200",
              accentStyles[result.mode.accent].border,
              accentStyles[result.mode.accent].bg
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className={cn("text-sm font-semibold", accentStyles[result.mode.accent].text)}>
                  <span className="mr-1.5" aria-hidden>
                    {result.mode.emoji}
                  </span>
                  {result.mode.goblinName}
                </p>
                <p className="text-xs text-muted-foreground">{result.mode.title}</p>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                Brain Mode Active
              </Badge>
            </div>
            <p className="mt-2 text-sm italic text-muted-foreground">
              &ldquo;{result.mode.tagline}&rdquo;
            </p>
            <ul className="mt-3 space-y-1.5">
              {result.perspective.map((line, index) => (
                <li key={index} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-current opacity-50" />
                  {line}
                </li>
              ))}
            </ul>
            {result.adjustments.length > 0 && (
              <div className="mt-3 border-t border-border/40 pt-3">
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  What {result.mode.goblinName.split(" ")[0]} changed
                </p>
                <ul className="space-y-1">
                  {result.adjustments.map((adj, index) => (
                    <li key={index} className="text-xs text-muted-foreground">
                      → {adj}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
