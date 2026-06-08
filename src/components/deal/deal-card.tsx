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
import { getDealViewModel } from "@/lib/deal-view-model";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import type { SavedDeal } from "@/lib/types/deal";
import { cn } from "@/lib/utils";

interface DealCardProps {
  deal: SavedDeal;
  onView: (deal: SavedDeal) => void;
  onEdit: (deal: SavedDeal) => void;
  onDelete: (id: string) => void;
}

export function DealCard({ deal, onView, onEdit, onDelete }: DealCardProps) {
  const vm = getDealViewModel(deal);
  const { analysis, verdict, display, input } = vm;

  return (
    <Card className="border-border/50 bg-card/60">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-base">{input.itemName}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {input.category} · {formatDate(vm.updatedAt)}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0", display.verdictBadgeClassName)}
        >
          {verdict.emoji} {verdict.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">
            {display.resaleSourceLabel}
          </Badge>
          <span
            className={cn("text-[10px]", display.confidenceTextClassName)}
          >
            {display.confidenceLabel}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-lg bg-background/60 p-2">
            <p className="text-xs text-muted-foreground">Ask</p>
            <p className="font-medium">{formatCurrency(input.askingPrice)}</p>
          </div>
          <div className="rounded-lg bg-background/60 p-2">
            <p className="text-xs text-muted-foreground">Resale</p>
            <p className="font-medium">{display.resaleDisplay}</p>
          </div>
          <div className="rounded-lg bg-background/60 p-2">
            <p className="text-xs text-muted-foreground">Profit</p>
            <p
              className={cn(
                "font-medium",
                display.profitPositive ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {formatCurrency(analysis.potentialProfit)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>ROI {formatPercent(analysis.roiPercent)}</span>
          <span>Flip {analysis.flipScore}/10</span>
          <span>Risk {analysis.riskScore}/10</span>
        </div>

        {input.notes && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {input.notes}
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
                  &ldquo;{input.itemName}&rdquo; will be removed from your saved
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
