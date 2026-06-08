"use client";

import { useMemo, useState } from "react";
import { BookmarkPlus, RotateCcw } from "lucide-react";
import { analyzeDeal } from "@/lib/analysis/engine";
import { analyzeWithBrainMode } from "@/lib/analysis/brain-modes";
import { getGoblinVerdict } from "@/lib/analysis/verdict";
import type { PrefillableField } from "@/lib/intake/listing-parser";
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
import { GoblinVerdict } from "@/components/deal/goblin-verdict";
import { GoblinBrainMode } from "@/components/deal/goblin-brain-mode";
import { ResaleEstimatePanel } from "@/components/deal/resale-estimate-panel";
import { ScreenshotIntake } from "@/components/deal/screenshot-intake";
import { PrefillConfirmDialog } from "@/components/deal/prefill-confirm-dialog";
import type { BrainModeId } from "@/lib/types/brain-mode";
import { EMPTY_DEAL_INPUT, type DealInput, type SavedDeal } from "@/lib/types/deal";

interface DealAnalyzerProps {
  onSave: (input: DealInput) => void;
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
  }

  function handleSave() {
    if (!preview) return;
    onSave(preview.input);
    setPreview({ ...preview, saved: true });
  }

  function handleReset() {
    setPreview(null);
    setBrainMode(null);
  }

  function handleEditSubmit(input: DealInput) {
    if (editingDeal) {
      onEdit(editingDeal.id, input);
      onClearEdit();
    }
  }

  const standardAnalysis = preview ? analyzeDeal(preview.input) : null;
  const standardVerdict =
    preview && standardAnalysis
      ? getGoblinVerdict(preview.input, standardAnalysis)
      : null;

  const brainResult = useMemo(() => {
    if (!preview || !brainMode) return null;
    return analyzeWithBrainMode(preview.input, brainMode);
  }, [preview, brainMode]);

  const displayAnalysis = brainResult?.analysis ?? standardAnalysis;
  const displayVerdict = brainResult?.verdict ?? standardVerdict;

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

          <ResaleEstimatePanel estimate={displayAnalysis.resaleEstimate} />

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
