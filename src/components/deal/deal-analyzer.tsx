"use client";

import { useMemo, useState } from "react";
import { BookmarkPlus, RotateCcw } from "lucide-react";
import { analyzeWithBrainMode } from "@/lib/analysis/brain-modes";
import { getPreviewViewModel } from "@/lib/deal-view-model";
import type { PrefillableField } from "@/lib/intake/listing-parser";
import type { SaveDealOptions } from "@/lib/storage/deals";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DealForm } from "@/components/deal/deal-form";
import { AnalysisMetrics } from "@/components/deal/analysis-metrics";
import { ComparableSalesPanel } from "@/components/deal/comparable-sales-panel";
import { GoblinVerdict } from "@/components/deal/goblin-verdict";
import { GoblinBrainMode } from "@/components/deal/goblin-brain-mode";
import { ResaleEstimatePanel } from "@/components/deal/resale-estimate-panel";
import { ScreenshotIntake } from "@/components/deal/screenshot-intake";
import { PrefillConfirmDialog } from "@/components/deal/prefill-confirm-dialog";
import type { BrainModeId } from "@/lib/types/brain-mode";
import type { ComparableSale } from "@/lib/types/comps";
import { EMPTY_DEAL_INPUT, type DealInput, type SavedDeal } from "@/lib/types/deal";

interface DealAnalyzerProps {
  onSave: (input: DealInput, options?: SaveDealOptions) => void;
  onEdit: (id: string, input: DealInput) => void;
  editingDeal: SavedDeal | null;
  onClearEdit: () => void;
}

export function DealAnalyzer({
  onSave,
  onEdit,
  editingDeal,
  onClearEdit,
}: DealAnalyzerProps) {
  const [formInput, setFormInput] = useState<DealInput>(EMPTY_DEAL_INPUT);
  const [touchedFields, setTouchedFields] = useState<Set<PrefillableField>>(
    new Set()
  );
  const [pendingPrefill, setPendingPrefill] = useState<Partial<DealInput> | null>(
    null
  );
  const [preview, setPreview] = useState<{
    input: DealInput;
    saved: boolean;
  } | null>(null);
  const [brainMode, setBrainMode] = useState<BrainModeId | null>(null);
  const [comps, setComps] = useState<ComparableSale[]>([]);
  const [useCompsForResale, setUseCompsForResale] = useState(false);

  const analysisOptions = useMemo(
    () => ({ comps, useCompsForResale }),
    [comps, useCompsForResale]
  );

  function handleFieldTouched(field: PrefillableField) {
    setTouchedFields((prev) => new Set(prev).add(field));
  }

  function handleRequestFill(proposed: Partial<DealInput>) {
    setPendingPrefill(proposed);
  }

  function handlePrefillConfirm(merged: DealInput) {
    setFormInput(merged);
    setPendingPrefill(null);
  }

  function handleAnalyze(input: DealInput) {
    setPreview({ input, saved: false });
    setBrainMode(null);
    setComps([]);
    setUseCompsForResale(false);
  }

  function handleSave() {
    if (!preview) return;
    onSave(preview.input, { comps, useCompsForResale });
    setPreview({ ...preview, saved: true });
  }

  function handleReset() {
    setPreview(null);
    setBrainMode(null);
    setComps([]);
    setUseCompsForResale(false);
  }

  function handleEditSubmit(input: DealInput) {
    if (editingDeal) {
      onEdit(editingDeal.id, input);
      onClearEdit();
    }
  }

  const previewViewModel = useMemo(() => {
    if (!preview) return null;
    return getPreviewViewModel(preview.input, comps, useCompsForResale);
  }, [preview, comps, useCompsForResale]);

  const brainResult = useMemo(() => {
    if (!preview || !brainMode) return null;
    return analyzeWithBrainMode(preview.input, brainMode, analysisOptions);
  }, [preview, brainMode, analysisOptions]);

  const displayAnalysis =
    brainResult?.analysis ?? previewViewModel?.analysis ?? null;
  const displayVerdict =
    brainResult?.verdict ?? previewViewModel?.verdict ?? null;
  const estimateWarnings = brainResult ? [] : previewViewModel?.display.warnings ?? [];

  return (
    <div className="space-y-6">
      <ScreenshotIntake onRequestFill={handleRequestFill} />

      <DealForm
        value={formInput}
        onChange={setFormInput}
        onFieldTouched={handleFieldTouched}
        onSubmit={handleAnalyze}
      />

      <PrefillConfirmDialog
        open={pendingPrefill !== null}
        current={formInput}
        proposed={pendingPrefill ?? {}}
        touchedFields={touchedFields}
        onConfirm={handlePrefillConfirm}
        onCancel={() => setPendingPrefill(null)}
      />

      {preview && displayAnalysis && displayVerdict && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Analysis: {preview.input.itemName}
              </h2>
              {brainResult ? (
                <p className="text-xs text-muted-foreground">
                  Viewing through {brainResult.mode.goblinName}&apos;s lens
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Standard goblin analysis
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="size-3.5" aria-hidden />
              Clear
            </Button>
          </div>

          <ComparableSalesPanel
            comps={comps}
            useCompsForResale={useCompsForResale}
            persisted={false}
            onCompsChange={setComps}
            onUseCompsChange={setUseCompsForResale}
          />

          <ResaleEstimatePanel
            estimate={displayAnalysis.resaleEstimate}
            warnings={estimateWarnings}
          />

          <GoblinBrainMode
            activeMode={brainMode}
            onModeChange={(mode) => setBrainMode(mode)}
            result={brainResult}
          />

          <AnalysisMetrics analysis={displayAnalysis} />
          <GoblinVerdict verdict={displayVerdict} />

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={preview.saved}
              className="bg-amber-600 text-white hover:bg-amber-500"
            >
              <BookmarkPlus className="size-4" aria-hidden />
              {preview.saved ? "Saved to Cave" : "Save Deal"}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!editingDeal} onOpenChange={(open) => !open && onClearEdit()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
            <DialogDescription>
              Update listing details and recalculate the goblin verdict.
            </DialogDescription>
          </DialogHeader>
          {editingDeal && (
            <DealForm
              key={editingDeal.id}
              initialValues={editingDeal}
              submitLabel="Update Deal"
              onSubmit={handleEditSubmit}
              onCancel={onClearEdit}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
