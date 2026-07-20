"use client";

import type { CompProgress } from "@/lib/analysis/comp-progress";
import { cn } from "@/lib/utils";

interface CompProgressIndicatorProps {
  progress: CompProgress;
}

const STEPS = [
  "Rough Estimate",
  "Market Informed",
  "Strong Estimate",
  "High Confidence",
] as const;

const tierStyles = {
  rough: "text-muted-foreground",
  market_informed: "text-sky-400",
  strong: "text-emerald-400",
  high_confidence: "text-amber-300",
};

const dotActive = {
  rough: "bg-muted-foreground",
  market_informed: "bg-sky-500",
  strong: "bg-emerald-500",
  high_confidence: "bg-amber-400",
};

export function CompProgressIndicator({ progress }: CompProgressIndicatorProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border/50 bg-background/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Estimate progress
        </p>
        <p
          className={cn(
            "text-xs font-semibold",
            tierStyles[progress.tier]
          )}
        >
          {progress.label}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {STEPS.map((step, index) => (
          <div key={step} className="flex flex-1 items-center gap-1">
            <div
              className={cn(
                "size-2 shrink-0 rounded-full transition-colors",
                index <= progress.stepIndex
                  ? dotActive[progress.tier]
                  : "bg-border"
              )}
              title={step}
            />
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 rounded-full",
                  index < progress.stepIndex ? "bg-emerald-500/50" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {progress.guidance}
      </p>

      <p className="text-[10px] text-muted-foreground">
        {progress.validCount} comp{progress.validCount === 1 ? "" : "s"} ·{" "}
        {progress.soldCount} sold
      </p>
    </div>
  );
}
