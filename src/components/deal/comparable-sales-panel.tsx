"use client";

import { useState } from "react";
import { BarChart3, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  calculateCompSummary,
  canUseCompsAsEstimate,
} from "@/lib/analysis/comp-calculations";
import {
  getConfidenceLabel,
} from "@/lib/analysis/resale-estimate";
import { formatCurrency } from "@/lib/format";
import {
  COMP_PLATFORMS,
  EMPTY_COMP,
  MIN_COMPS_FOR_ESTIMATE,
  generateCompId,
  type ComparableSale,
  type CompListingType,
} from "@/lib/types/comps";
import { PasteCompText } from "@/components/deal/paste-comp-text";
import { DEAL_CONDITIONS } from "@/lib/types/deal";
import { cn } from "@/lib/utils";

interface ComparableSalesPanelProps {
  comps: ComparableSale[];
  useCompsForResale: boolean;
  onCompsChange: (comps: ComparableSale[]) => void;
  onUseCompsChange: (use: boolean) => void;
  /** When false, comps are session-only until the deal is saved. */
  persisted?: boolean;
}

const confidenceStyles = {
  low: "text-rose-400",
  medium: "text-amber-400",
  high: "text-emerald-400",
};

const listingTypeStyles = {
  sold: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  listed: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export function ComparableSalesPanel({
  comps,
  useCompsForResale,
  onCompsChange,
  onUseCompsChange,
  persisted = false,
}: ComparableSalesPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Omit<ComparableSale, "id">>(EMPTY_COMP);

  const summary = calculateCompSummary(comps);
  const canUseComps = canUseCompsAsEstimate(comps);

  function resetDraft() {
    setDraft(EMPTY_COMP);
    setShowForm(false);
  }

  function handleAddComp() {
    if (!draft.title.trim() || draft.price <= 0) return;

    onCompsChange([
      ...comps,
      {
        ...draft,
        id: generateCompId(),
        title: draft.title.trim(),
        notes: draft.notes.trim(),
      },
    ]);
    resetDraft();
  }

  function handleRemoveComp(id: string) {
    onCompsChange(comps.filter((comp) => comp.id !== id));
    if (useCompsForResale && !canUseCompsAsEstimate(comps.filter((c) => c.id !== id))) {
      onUseCompsChange(false);
    }
  }

  function updateDraft<K extends keyof Omit<ComparableSale, "id">>(
    key: K,
    value: Omit<ComparableSale, "id">[K]
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleImportComps(imported: ComparableSale[]) {
    onCompsChange([...comps, ...imported]);
  }

  return (
    <Card className="border-border/50 bg-card/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-emerald-400" aria-hidden />
              Comparable Sales
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {persisted
                ? "Saved with this deal. Comps drive analysis when enabled."
                : "Temporary until you save the deal."}
            </p>
          </div>
          {summary && (
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {summary.count} comp{summary.count !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {summary ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Average" value={formatCurrency(summary.average)} />
              <Stat label="Median" value={formatCurrency(summary.median)} highlight />
              <Stat
                label="Range"
                value={`${formatCurrency(summary.low)}–${formatCurrency(summary.high)}`}
              />
              <Stat
                label="Confidence"
                value={getConfidenceLabel(summary.confidence)}
                valueClassName={confidenceStyles[summary.confidence]}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {summary.soldCount} sold · {summary.listedCount} listed
            </p>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border/60 bg-background/40 p-4 text-center text-xs text-muted-foreground">
            Add sold or listed comps to replace rough estimates with your own
            market data.
          </p>
        )}

        {comps.length > 0 && (
          <ul className="space-y-2">
            {comps.map((comp) => (
              <li
                key={comp.id}
                className="flex items-start justify-between gap-2 rounded-lg bg-background/60 p-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-medium">{comp.title}</p>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px]", listingTypeStyles[comp.listingType])}
                    >
                      {comp.listingType === "sold" ? "Sold" : "Listed"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {comp.platform} · {comp.condition} ·{" "}
                    {formatCurrency(comp.price)}
                  </p>
                  {comp.notes && (
                    <p className="line-clamp-2 text-[10px] text-muted-foreground">
                      {comp.notes}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-rose-400"
                  onClick={() => handleRemoveComp(comp.id)}
                  aria-label={`Remove ${comp.title}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {showForm ? (
          <div className="space-y-3 rounded-lg border border-border/50 bg-background/40 p-3">
            <div className="space-y-1.5">
              <Label htmlFor="comp-title">Title</Label>
              <Input
                id="comp-title"
                placeholder="e.g. iPhone 13 Pro 128GB"
                value={draft.title}
                onChange={(e) => updateDraft("title", e.target.value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select
                  value={draft.platform}
                  onValueChange={(value) => {
                    if (value) updateDraft("platform", value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMP_PLATFORMS.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="comp-price">Price ($)</Label>
                <Input
                  id="comp-price"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="0"
                  value={draft.price || ""}
                  onChange={(e) =>
                    updateDraft("price", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Condition</Label>
                <Select
                  value={draft.condition}
                  onValueChange={(value) => {
                    if (value) {
                      updateDraft(
                        "condition",
                        value as ComparableSale["condition"]
                      );
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEAL_CONDITIONS.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Listing type</Label>
                <ListingTypeToggle
                  value={draft.listingType}
                  onChange={(type) => updateDraft("listingType", type)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-notes">Notes</Label>
              <Textarea
                id="comp-notes"
                placeholder="Optional — shipping, bundle, date sold..."
                rows={2}
                value={draft.notes}
                onChange={(e) => updateDraft("notes", e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
                onClick={handleAddComp}
                disabled={!draft.title.trim() || draft.price <= 0}
              >
                Add comp
              </Button>
              <Button variant="outline" onClick={resetDraft}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowForm(true)}
          >
            <Plus className="size-4" aria-hidden />
            Add comparable
          </Button>
        )}

        <PasteCompText onImport={handleImportComps} />

        {canUseComps && (
          <div className="space-y-2 border-t border-border/40 pt-3">
            <Button
              variant={useCompsForResale ? "default" : "outline"}
              className={cn(
                "w-full",
                useCompsForResale &&
                  "bg-emerald-600 text-white hover:bg-emerald-500"
              )}
              onClick={() => onUseCompsChange(!useCompsForResale)}
            >
              {useCompsForResale
                ? "Using comps as resale estimate"
                : "Use comps as resale estimate"}
            </Button>
            {!useCompsForResale && (
              <p className="text-center text-[10px] text-muted-foreground">
                Requires {MIN_COMPS_FOR_ESTIMATE}+ comps with valid prices
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  highlight,
  valueClassName,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  valueClassName?: string;
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
      <p className={cn("text-sm font-semibold", valueClassName)}>{value}</p>
    </div>
  );
}

function ListingTypeToggle({
  value,
  onChange,
}: {
  value: CompListingType;
  onChange: (type: CompListingType) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border/60 bg-background/60 p-0.5">
      {(["sold", "listed"] as const).map((type) => (
        <button
          key={type}
          type="button"
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors",
            value === type
              ? type === "sold"
                ? "bg-emerald-600 text-white"
                : "bg-amber-600 text-white"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onChange(type)}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
