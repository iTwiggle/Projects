"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  getConfidenceLabel,
  getResaleSourceLabel,
} from "@/lib/analysis/resale-estimate";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import type { SavedDeal } from "@/lib/types/deal";
import { cn } from "@/lib/utils";

interface DealCardProps {
  deal: SavedDeal;
  onView: (deal: SavedDeal) => void;
  onEdit: (deal: SavedDeal) => void;
  onDelete: (id: string) => void;
}

const verdictBadgeStyles = {
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  caution: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  reject: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

const confidenceStyles = {
  low: "text-rose-400",
  medium: "text-amber-400",
  high: "text-emerald-400",
};

export function DealCard({ deal, onView, onEdit, onDelete }: DealCardProps) {
  const profitPositive = deal.analysis.potentialProfit >= 0;
  const estimate = deal.analysis.resaleEstimate;
  const showResaleRange =
    estimate &&
    estimate.low !== estimate.high &&
    estimate.source !== "manual";

  const resaleDisplay = estimate
    ? showResaleRange
      ? `${formatCurrency(estimate.low)}–${formatCurrency(estimate.high)}`
      : formatCurrency(estimate.midpoint)
    : formatCurrency(deal.knownResaleValue ?? 0);

  return (
    <Card className="border-border/50 bg-card/60">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-base">{deal.itemName}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {deal.category} · {formatDate(deal.updatedAt)}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0", verdictBadgeStyles[deal.verdict.type])}
        >
          {deal.verdict.emoji} {deal.verdict.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {estimate && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              {getResaleSourceLabel(estimate.source)}
            </Badge>
            <span
              className={cn(
                "text-[10px]",
                confidenceStyles[estimate.confidence]
              )}
            >
              {getConfidenceLabel(estimate.confidence)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-lg bg-background/60 p-2">
            <p className="text-xs text-muted-foreground">Ask</p>
            <p className="font-medium">{formatCurrency(deal.askingPrice)}</p>
          </div>
          <div className="rounded-lg bg-background/60 p-2">
            <p className="text-xs text-muted-foreground">Resale</p>
            <p className="font-medium">{resaleDisplay}</p>
          </div>
          <div className="rounded-lg bg-background/60 p-2">
            <p className="text-xs text-muted-foreground">Profit</p>
            <p
              className={cn(
                "font-medium",
                profitPositive ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {formatCurrency(deal.analysis.potentialProfit)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>ROI {formatPercent(deal.analysis.roiPercent)}</span>
          <span>Flip {deal.analysis.flipScore}/10</span>
          <span>Risk {deal.analysis.riskScore}/10</span>
        </div>

        {deal.notes && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {deal.notes}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView(deal)}
          >
            <Eye className="size-3.5" aria-hidden />
            Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(deal)}
          >
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-400 hover:text-rose-300"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this deal?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{deal.itemName}&rdquo; will be removed from your saved
                  deals. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-600 hover:bg-rose-500"
                  onClick={() => onDelete(deal.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
