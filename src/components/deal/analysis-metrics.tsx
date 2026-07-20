import {
  Clock,
  ShieldAlert,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { DealAnalysis } from "@/lib/types/deal";
import { cn } from "@/lib/utils";

interface AnalysisMetricsProps {
  analysis: DealAnalysis;
}

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  accent?: "emerald" | "amber" | "rose" | "sky";
}

function MetricCard({
  label,
  value,
  subtext,
  icon,
  accent = "emerald",
}: MetricCardProps) {
  const accentClasses = {
    emerald: "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 ring-amber-500/20",
    rose: "text-rose-400 bg-rose-500/10 ring-rose-500/20",
    sky: "text-sky-400 bg-sky-500/10 ring-sky-500/20",
  };

  return (
    <Card className="border-border/50 bg-background/50">
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg ring-1",
            accentClasses[accent]
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-semibold">{value}</p>
          {subtext && (
            <p className="text-xs text-muted-foreground">{subtext}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function scoreAccent(score: number, invert = false): MetricCardProps["accent"] {
  const effective = invert ? 11 - score : score;
  if (effective >= 7) return "emerald";
  if (effective >= 4) return "amber";
  return "rose";
}

export function AnalysisMetrics({ analysis }: AnalysisMetricsProps) {
  const profitPositive = analysis.potentialProfit >= 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <MetricCard
        label="Potential Profit"
        value={formatCurrency(analysis.potentialProfit)}
        subtext={profitPositive ? "Before fees & time" : "Negative margin"}
        icon={<TrendingUp className="size-4" aria-hidden />}
        accent={profitPositive ? "emerald" : "rose"}
      />
      <MetricCard
        label="ROI"
        value={formatPercent(analysis.roiPercent)}
        subtext="Return on asking price"
        icon={<Zap className="size-4" aria-hidden />}
        accent={analysis.roiPercent >= 25 ? "emerald" : "amber"}
      />
      <MetricCard
        label="Risk Score"
        value={`${analysis.riskScore}/10`}
        subtext="Lower is safer"
        icon={<ShieldAlert className="size-4" aria-hidden />}
        accent={scoreAccent(analysis.riskScore, true)}
      />
      <MetricCard
        label="Flip Score"
        value={`${analysis.flipScore}/10`}
        subtext="Higher is better"
        icon={<Zap className="size-4" aria-hidden />}
        accent={scoreAccent(analysis.flipScore)}
      />
      <MetricCard
        label="Time to Sell"
        value={analysis.timeToSellLabel}
        subtext={`~${analysis.timeToSellDays} days`}
        icon={<Clock className="size-4" aria-hidden />}
        accent="sky"
      />
    </div>
  );
}
