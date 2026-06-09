"use client";

import { useState } from "react";
import { Activity, BarChart3, RotateCcw, Shield } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUsageTelemetry } from "@/hooks/use-usage-telemetry";
import {
  getAverageCompsPerDeal,
  resetUsageTelemetry,
} from "@/lib/storage/usage-telemetry";
import { INTAKE_SOURCE_LABELS } from "@/lib/types/intake-source";
import { cn } from "@/lib/utils";

interface MetricProps {
  label: string;
  value: string;
  detail?: string;
}

function Metric({ label, value, detail }: MetricProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      {detail && <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>}
    </div>
  );
}

export function UsageDashboard() {
  const stats = useUsageTelemetry();
  const [resetOpen, setResetOpen] = useState(false);
  const averageComps = getAverageCompsPerDeal(stats);

  function handleReset() {
    resetUsageTelemetry();
    setResetOpen(false);
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">Local Usage Dashboard</h2>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            >
              <Shield className="mr-1 size-3" aria-hidden />
              Local only
            </Badge>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Friction metrics stored in this browser&apos;s localStorage only. No
            analytics service, backend, accounts, or network calls.
          </p>
        </div>

        <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
          <AlertDialogTrigger
            render={
              <Button type="button" variant="outline" size="sm" className="shrink-0">
                <RotateCcw className="size-3.5" aria-hidden />
                Reset telemetry
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset local usage telemetry?</AlertDialogTitle>
              <AlertDialogDescription>
                This clears all usage counters on this device. Saved deals are
                not affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card className="border-border/50 bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4 text-sky-400" aria-hidden />
            Capture &amp; import
          </CardTitle>
          <CardDescription>
            Last updated {new Date(stats.updatedAt).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Listings imported" value={String(stats.listingsImported)} />
          <Metric
            label="Facebook captures"
            value={String(stats.facebookCapturesImported)}
            detail={`${stats.facebookCapturesReceived} received`}
          />
          <Metric
            label="eBay captures"
            value={String(stats.ebayCapturesImported)}
            detail={`${stats.ebayCapturesReceived} received`}
          />
          <Metric
            label="Comp imports"
            value={String(stats.compImportEvents)}
            detail={`${stats.compsImported} comps total`}
          />
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-amber-400" aria-hidden />
            Analysis &amp; estimates
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Deals analyzed" value={String(stats.dealsAnalyzed)} />
          <Metric label="Deals saved" value={String(stats.dealsSaved)} />
          <Metric
            label="Avg comps / saved deal"
            value={averageComps == null ? "—" : averageComps.toFixed(1)}
          />
          <Metric
            label="Quick estimate used"
            value={String(stats.quickEstimateUsed)}
            detail="Analyze runs using category estimate"
          />
          <Metric
            label="Comp estimate used"
            value={String(stats.compEstimateUsed)}
            detail="Analyze runs using comp-based estimate"
          />
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Listing intake sources
            </p>
            <ul className="space-y-1 text-sm">
              {(Object.keys(stats.listingsImportedBySource) as Array<
                keyof typeof stats.listingsImportedBySource
              >).map((source) => (
                <li
                  key={source}
                  className={cn(
                    "flex justify-between gap-2",
                    stats.listingsImportedBySource[source] === 0 &&
                      "text-muted-foreground"
                  )}
                >
                  <span>{INTAKE_SOURCE_LABELS[source]}</span>
                  <span>{stats.listingsImportedBySource[source]}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Comp import channels
            </p>
            <ul className="space-y-1 text-sm">
              <li className="flex justify-between gap-2">
                <span>Extension</span>
                <span>{stats.compImportsByChannel.extension}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>JSON paste / file</span>
                <span>{stats.compImportsByChannel.json}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Plain text</span>
                <span>{stats.compImportsByChannel.paste}</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
