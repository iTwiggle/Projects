"use client";

import { Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DealViewModelCategoryIntel } from "@/lib/deal-view-model";
import { cn } from "@/lib/utils";

interface CategoryIntelligencePanelProps {
  categoryIntel: DealViewModelCategoryIntel;
}

const signalStyles = {
  risk: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  booster: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  penalty: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export function CategoryIntelligencePanel({
  categoryIntel,
}: CategoryIntelligencePanelProps) {
  const intel = categoryIntel.intelligence;
  const hasSignals =
    intel.matchedRisks.length > 0 ||
    intel.matchedBoosters.length > 0 ||
    intel.matchedPenalties.length > 0;

  return (
    <Card className="border-border/50 bg-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="size-4 text-violet-400" aria-hidden />
          Category Intelligence
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {intel.intelligenceCategory} signals from listing text, notes, and
          comps
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasSignals ? (
          <div className="flex flex-wrap gap-1.5">
            {intel.matchedRisks.map((signal) => (
              <Badge
                key={signal.id}
                variant="outline"
                className={cn("text-[10px]", signalStyles.risk)}
              >
                Risk: {signal.label}
              </Badge>
            ))}
            {intel.matchedPenalties.map((signal) => (
              <Badge
                key={signal.id}
                variant="outline"
                className={cn("text-[10px]", signalStyles.penalty)}
              >
                Penalty: {signal.label}
              </Badge>
            ))}
            {intel.matchedBoosters.map((signal) => (
              <Badge
                key={signal.id}
                variant="outline"
                className={cn("text-[10px]", signalStyles.booster)}
              >
                Boost: {signal.label}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-background/60 p-3 text-xs text-muted-foreground">
            No category-specific flags detected in text — use the inspection
            checklist before buying.
          </p>
        )}

        {intel.advice.length > 0 && (
          <div className="space-y-1.5 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
            <p className="text-xs font-medium text-violet-300">Advice</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {intel.advice.map((line) => (
                <li key={line} className="leading-relaxed">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-1.5 rounded-lg bg-background/60 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Inspection checklist
          </p>
          <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
            {categoryIntel.inspectionChecklist.map((item) => (
              <li key={item} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {intel.resaleSpeedNotes.length > 0 && (
          <div className="space-y-1.5 rounded-lg bg-background/60 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Resale speed
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {intel.resaleSpeedNotes.map((note) => (
                <li key={note} className="leading-relaxed">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
