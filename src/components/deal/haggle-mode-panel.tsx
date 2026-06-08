"use client";

import { useState } from "react";
import { Check, Copy, HandCoins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { HaggleGuide } from "@/lib/types/haggle";
import { ASKING_RATING_LABELS } from "@/lib/types/haggle";
import { cn } from "@/lib/utils";

interface HaggleModePanelProps {
  haggle: HaggleGuide;
  askingPrice: number;
}

const ratingStyles = {
  great: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  good: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  tight: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  overpriced: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

function PriceRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{formatCurrency(value)}</span>
    </div>
  );
}

function ScriptBlock({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg bg-background/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="h-7 gap-1 text-xs"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-3 text-emerald-400" aria-hidden />
          ) : (
            <Copy className="size-3" aria-hidden />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

export function HaggleModePanel({ haggle, askingPrice }: HaggleModePanelProps) {
  return (
    <Card className="border-border/50 bg-card/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <HandCoins className="size-4 text-amber-400" aria-hidden />
            Haggle Mode
          </CardTitle>
          <Badge
            variant="outline"
            className={cn("shrink-0 text-[10px]", ratingStyles[haggle.askingPriceRating])}
          >
            {ASKING_RATING_LABELS[haggle.askingPriceRating]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {haggle.askingPriceRatingLabel}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Ask" value={formatCurrency(askingPrice)} />
          <Stat label="Net resale" value={formatCurrency(haggle.netResaleValue)} />
          <Stat
            label="Current ROI"
            value={formatPercent(haggle.currentRoiPercent)}
            highlight={haggle.currentRoiPercent >= 50}
          />
          <Stat
            label="Fees/buffer"
            value={formatCurrency(haggle.feesRepairsBuffer)}
          />
        </div>

        <div className="space-y-2 rounded-lg border border-border/40 bg-background/40 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Buy-price targets
          </p>
          <PriceRow label="Break-even" value={haggle.breakEvenBuyPrice} />
          <PriceRow label="Max for 100% ROI" value={haggle.maxBuyPrice100Roi} />
          <PriceRow label="Max for 50% ROI" value={haggle.maxBuyPrice50Roi} />
          <PriceRow label="Max for 25% ROI" value={haggle.maxBuyPrice25Roi} />
        </div>

        <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-xs font-medium text-amber-400">Negotiation targets</p>
          <PriceRow label="Suggested opening offer" value={haggle.suggestedOpeningOffer} />
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Fair counter range</span>
            <span className="font-medium">
              {formatCurrency(haggle.counterofferLow)}–
              {formatCurrency(haggle.counterofferHigh)}
            </span>
          </div>
          <PriceRow label="Walk-away price" value={haggle.walkAwayPrice} />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Copy-paste scripts
          </p>
          <ScriptBlock title="Opening offer" text={haggle.scripts.openingOffer} />
          <ScriptBlock title="Counteroffer" text={haggle.scripts.counteroffer} />
          <ScriptBlock title="Walk-away" text={haggle.scripts.walkAway} />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-2 text-center",
        highlight ? "bg-emerald-500/10 ring-1 ring-emerald-500/20" : "bg-background/60"
      )}
    >
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
