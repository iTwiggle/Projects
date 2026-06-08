"use client";

import { useMemo, useState } from "react";
import { BookmarkPlus, RotateCcw } from "lucide-react";
import { analyzeDeal } from "@/lib/analysis/engine";
import { analyzeWithBrainMode } from "@/lib/analysis/brain-modes";
import { getGoblinVerdict } from "@/lib/analysis/verdict";
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
import type { BrainModeId } from "@/lib/types/brain-mode";
import type { DealInput, SavedDeal } from "@/lib/types/deal";

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
  const [preview, setPreview] = useState<{
    input: DealInput;
    saved: boolean;
  } | null>(null);
  const [brainMode, setBrainMode] = useState<BrainModeId | null>(null);

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
      <DealForm onSubmit={handleAnalyze} />

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
