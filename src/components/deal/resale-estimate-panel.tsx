import { AlertTriangle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getConfidenceLabel,
  getResaleSourceLabel,
} from "@/lib/analysis/resale-estimate";
import { formatCurrency } from "@/lib/format";
import type { ResaleEstimate } from "@/lib/types/deal";
import { cn } from "@/lib/utils";

interface ResaleEstimatePanelProps {
  estimate: ResaleEstimate;
}

const confidenceStyles = {
  low: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  high: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export function ResaleEstimatePanel({ estimate }: ResaleEstimatePanelProps) {
  const isEstimated = estimate.source === "estimated";
  const isComps = estimate.source === "comps";
  const showRange = estimate.low !== estimate.high;

  return (
    <Card className="border-border/50 bg-card/60">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Sparkles
              className={cn(
                "size-4",
                isEstimated ? "text-amber-400" : "text-emerald-400"
              )}
              aria-hidden
            />
            <span className="text-sm font-medium">
              {getResaleSourceLabel(estimate.source)}
            </span>
          </div>
          <Badge
            variant="outline"
            className={cn("text-[10px]", confidenceStyles[estimate.confidence])}
          >
            {getConfidenceLabel(estimate.confidence)}
          </Badge>
        </div>

        {showRange ? (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-background/60 p-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Low
              </p>
              <p className="text-sm font-semibold">
                {formatCurrency(estimate.low)}
              </p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-2 ring-1 ring-emerald-500/20">
              <p className="text-[10px] uppercase tracking-wide text-emerald-400">
                Midpoint
              </p>
              <p className="text-base font-bold text-emerald-400">
                {formatCurrency(estimate.midpoint)}
              </p>
            </div>
            <div className="rounded-lg bg-background/60 p-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                High
              </p>
              <p className="text-sm font-semibold">
                {formatCurrency(estimate.high)}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-background/60 p-3 text-center">
            <p className="text-xs text-muted-foreground">Resale value</p>
            <p className="text-xl font-bold">
              {formatCurrency(estimate.midpoint)}
            </p>
          </div>
        )}

        {isEstimated && (
          <div className="flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-amber-400"
              aria-hidden
            />
            <p className="text-xs text-muted-foreground">
              Fast triage only. Verify comps before buying.
            </p>
          </div>
        )}

        {isComps && (
          <p className="text-xs text-muted-foreground">
            Resale estimate uses the median of your comparable sales.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
