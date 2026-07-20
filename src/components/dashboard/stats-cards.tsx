import { Crown, DollarSign, Percent, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { DashboardStats } from "@/lib/types/deal";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  stats: DashboardStats;
}

interface StatCardProps {
  label: string;
  value: string;
  detail?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

function StatCard({ label, value, detail, icon, highlight }: StatCardProps) {
  return (
    <Card
      className={cn(
        "border-border/50 bg-card/60",
        highlight && "ring-1 ring-amber-500/30"
      )}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-bold">{value}</p>
          {detail && (
            <p className="truncate text-xs text-muted-foreground">{detail}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Total Deals"
        value={stats.totalDeals.toString()}
        icon={<Package className="size-4" aria-hidden />}
      />
      <StatCard
        label="Potential Profit"
        value={formatCurrency(stats.totalPotentialProfit)}
        detail="Across saved deals"
        icon={<DollarSign className="size-4" aria-hidden />}
      />
      <StatCard
        label="Average ROI"
        value={formatPercent(stats.averageRoi)}
        detail="Mean return"
        icon={<Percent className="size-4" aria-hidden />}
      />
      <StatCard
        label="Best Deal"
        value={
          stats.bestDeal
            ? formatCurrency(stats.bestDeal.potentialProfit)
            : "—"
        }
        detail={stats.bestDeal?.itemName ?? "No deals yet"}
        icon={<Crown className="size-4" aria-hidden />}
        highlight={!!stats.bestDeal}
      />
    </div>
  );
}
