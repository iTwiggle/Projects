"use client";

import { useState } from "react";
import { BarChart3, Plus, Trash2, Zap } from "lucide-react";
import { getCompProgress } from "@/lib/analysis/comp-progress";
import {
  buildQuickComp,
  isValidQuickComp,
} from "@/lib/analysis/comp-quick-entry";
import {
  calculateCompSummary,
  canUseCompsAsEstimate,
} from "@/lib/analysis/comp-calculations";
import { getConfidenceLabel } from "@/lib/analysis/resale-estimate";
import { CompProgressIndicator } from "@/components/deal/comp-progress-indicator";
import { formatCurrency } from "@/lib/format";
import {
  getLastCompPlatform,
  setLastCompPlatform,
} from "@/lib/storage/comp-session";
import {
  COMP_PLATFORMS,
  EMPTY_COMP,
  MIN_COMPS_FOR_ESTIMATE,
  generateCompId,
  type ComparableSale,
  type CompListingType,
} from "@/lib/types/comps";
import { CompSearchLinksPanel } from "@/components/deal/comp-search-links-panel";
import { PasteCompText } from "@/components/deal/paste-comp-text";
import type { CompSearchQuery } from "@/lib/types/comp-search";
import { DEAL_CONDITIONS, type DealCondition } from "@/lib/types/deal";
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
import { cn } from "@/lib/utils";

interface ComparableSalesPanelProps {
  comps: ComparableSale[];
  useCompsForResale: boolean;
  onCompsChange: (comps: ComparableSale[]) => void;
  onUseCompsChange: (use: boolean) => void;
  /** When false, comps are session-only until the deal is saved. */
  persisted?: boolean;
  dealCondition?: DealCondition;
  compsEstimateManualOff?: boolean;
  onCompsEstimateManualOffChange?: (manualOff: boolean) => void;
  compSearch?: CompSearchQuery | null;
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
  dealCondition = "Good",
  compsEstimateManualOff = false,
  onCompsEstimateManualOffChange,
  compSearch = null,
}: ComparableSalesPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Omit<ComparableSale, "id">>(() => ({
    ...EMPTY_COMP,
    platform: getLastCompPlatform(),
    condition: dealCondition,
  }));
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPrice, setQuickPrice] = useState("");
  const [quickListingType, setQuickListingType] =
    useState<CompListingType>("sold");
  const [bulkPlatform, setBulkPlatform] = useState(getLastCompPlatform());

  const progress = getCompProgress(comps);
  const summary = calculateCompSummary(comps);
  const canUseComps = canUseCompsAsEstimate(comps);

  function resetDraft() {
    setDraft({
      ...EMPTY_COMP,
      platform: getLastCompPlatform(),
      condition: dealCondition,
    });
    setShowForm(false);
  }

  function rememberPlatform(platform: string) {
    setLastCompPlatform(platform);
    setBulkPlatform(platform);
  }

  function appendComp(comp: Omit<ComparableSale, "id">) {
    rememberPlatform(comp.platform);
    onCompsChange([
      ...comps,
      {
        ...comp,
        id: generateCompId(),
        title: comp.title.trim(),
        notes: comp.notes.trim(),
      },
    ]);
  }

  function handleAddComp() {
    if (!draft.title.trim() || draft.price <= 0) return;
    appendComp(draft);
    resetDraft();
  }

  function handleQuickAdd() {
    const price = parseFloat(quickPrice) || 0;
    if (!isValidQuickComp(quickTitle, price)) return;

    appendComp(
      buildQuickComp(quickTitle, price, quickListingType, {
        platform: getLastCompPlatform(),
        condition: dealCondition,
      })
    );
    setQuickTitle("");
    setQuickPrice("");
  }

  function handleRemoveComp(id: string) {
    onCompsChange(comps.filter((comp) => comp.id !== id));
  }

  function updateDraft<K extends keyof Omit<ComparableSale, "id">>(
    key: K,
    value: Omit<ComparableSale, "id">[K]
  ) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "platform" && typeof value === "string") {
        rememberPlatform(value);
      }
      return next;
    });
  }

  function handleImportComps(imported: ComparableSale[]) {
    const last = imported[imported.length - 1];
    if (last?.platform) rememberPlatform(last.platform);
    onCompsChange([...comps, ...imported]);
  }

  function handleEstimateToggle() {
    const next = !useCompsForResale;
    onCompsEstimateManualOffChange?.(!next);
    onUseCompsChange(next);
  }

  function markAllListingType(listingType: CompListingType) {
    onCompsChange(comps.map((comp) => ({ ...comp, listingType })));
  }

  function setPlatformForAll(platform: string) {
    rememberPlatform(platform);
    onCompsChange(comps.map((comp) => ({ ...comp, platform })));
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
                : "Draft saved locally until you save the deal."}
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
        {compSearch && <CompSearchLinksPanel compSearch={compSearch} />}

        <CompProgressIndicator progress={progress} />

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
        ) : null}

        <div className="space-y-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-2">
            <Zap className="size-3.5 text-emerald-400" aria-hidden />
            <p className="text-xs font-medium text-emerald-300">Quick comp</p>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Title — e.g. iPhone 13 Pro 128GB sold"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min={0}
                step={1}
                placeholder="Price"
                value={quickPrice}
                onChange={(e) => setQuickPrice(e.target.value)}
              />
              <ListingTypeToggle
                value={quickListingType}
                onChange={setQuickListingType}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Defaults: {getLastCompPlatform()} · {dealCondition} · no notes
            </p>
            <Button
              type="button"
              size="sm"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
              onClick={handleQuickAdd}
              disabled={!isValidQuickComp(quickTitle, parseFloat(quickPrice) || 0)}
            >
              <Plus className="size-3.5" aria-hidden />
              Add quick comp
            </Button>
          </div>
        </div>

        {comps.length > 0 && (
          <>
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

            <div className="space-y-2 rounded-lg border border-border/40 bg-background/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Bulk actions
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => markAllListingType("sold")}
                >
                  Mark all sold
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => markAllListingType("listed")}
                >
                  Mark all listed
                </Button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-1">
                  <Label className="text-[10px]">Set platform for all</Label>
                  <Select
                    value={bulkPlatform}
                    onValueChange={(value) => {
                      if (value) setBulkPlatform(value);
                    }}
                  >
                    <SelectTrigger className="h-8 w-full">
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setPlatformForAll(bulkPlatform)}
                >
                  Apply to all
                </Button>
              </div>
            </div>
          </>
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
            Add full comparable
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
              onClick={handleEstimateToggle}
            >
              {useCompsForResale
                ? "Using comps as resale estimate"
                : "Use comps as resale estimate"}
            </Button>
            {!useCompsForResale && (
              <p className="text-center text-[10px] text-muted-foreground">
                {compsEstimateManualOff
                  ? "Auto-enable paused — tap to use comps again."
                  : `Requires ${MIN_COMPS_FOR_ESTIMATE}+ comps with valid prices`}
              </p>
            )}
            {useCompsForResale && !compsEstimateManualOff && (
              <p className="text-center text-[10px] text-emerald-400/80">
                Auto-enabled — {MIN_COMPS_FOR_ESTIMATE}+ comps detected.
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
