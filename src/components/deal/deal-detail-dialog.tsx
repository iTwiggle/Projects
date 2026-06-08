"use client";

import { useState } from "react";
import { canUseCompsAsEstimate } from "@/lib/analysis/comp-calculations";
import { resolveUseCompsForResale } from "@/lib/analysis/comp-progress";
import { getDealViewModel } from "@/lib/deal-view-model";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ComparableSale } from "@/lib/types/comps";
import type { SavedDeal } from "@/lib/types/deal";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnalysisMetrics } from "@/components/deal/analysis-metrics";
import { CategoryIntelligencePanel } from "@/components/deal/category-intelligence-panel";
import { ComparableSalesPanel } from "@/components/deal/comparable-sales-panel";
import { GoblinVerdict } from "@/components/deal/goblin-verdict";
import { HaggleModePanel } from "@/components/deal/haggle-mode-panel";
import { ListingLinkPanel } from "@/components/deal/listing-link-panel";
import { ResaleEstimatePanel } from "@/components/deal/resale-estimate-panel";
import { cn } from "@/lib/utils";

interface DealDetailDialogProps {
  deal: SavedDeal | null;
  onClose: () => void;
  onCompsChange: (
    id: string,
    comps: ComparableSale[],
    useCompsForResale: boolean
  ) => void;
}

function DealDetailContent({
  deal,
  onCompsChange,
}: {
  deal: SavedDeal;
  onCompsChange: DealDetailDialogProps["onCompsChange"];
}) {
  const vm = getDealViewModel(deal);
  const [compsEstimateManualOff, setCompsEstimateManualOff] = useState(
    () =>
      deal.useCompsForResale === false &&
      canUseCompsAsEstimate(deal.comps ?? [])
  );

  function handleCompsChange(nextComps: ComparableSale[]) {
    const nextUse = resolveUseCompsForResale(
      nextComps,
      compsEstimateManualOff,
      vm.useCompsForResale
    );
    onCompsChange(deal.id, nextComps, nextUse);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="pr-6">{vm.input.itemName}</DialogTitle>
        <DialogDescription>
          {vm.input.category} · {vm.input.condition} · Saved{" "}
          {formatDate(vm.updatedAt)}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(vm.display.verdictBadgeClassName)}
          >
            {vm.verdict.emoji} {vm.verdict.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Ask {formatCurrency(vm.input.askingPrice)}
          </span>
        </div>

        <ListingLinkPanel listing={vm.listing} />

        <ComparableSalesPanel
          comps={vm.comps}
          useCompsForResale={vm.useCompsForResale}
          persisted
          dealCondition={vm.input.condition}
          compsEstimateManualOff={compsEstimateManualOff}
          onCompsEstimateManualOffChange={setCompsEstimateManualOff}
          onCompsChange={handleCompsChange}
          onUseCompsChange={(useCompsForResale) =>
            onCompsChange(deal.id, vm.comps, useCompsForResale)
          }
        />

        <ResaleEstimatePanel
          estimate={vm.analysis.resaleEstimate}
          warnings={vm.display.warnings}
        />

        <CategoryIntelligencePanel categoryIntel={vm.categoryIntel} />

        <HaggleModePanel haggle={vm.haggle} askingPrice={vm.input.askingPrice} />
        <AnalysisMetrics analysis={vm.analysis} />
        <GoblinVerdict verdict={vm.verdict} />

        {vm.input.notes && (
          <p className="rounded-lg bg-background/60 p-3 text-xs text-muted-foreground">
            {vm.input.notes}
          </p>
        )}
      </div>
    </>
  );
}

export function DealDetailDialog({
  deal,
  onClose,
  onCompsChange,
}: DealDetailDialogProps) {
  return (
    <Dialog open={!!deal} onOpenChange={(open) => !open && onClose()}>
      {deal && (
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DealDetailContent
            key={deal.id}
            deal={deal}
            onCompsChange={onCompsChange}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}
