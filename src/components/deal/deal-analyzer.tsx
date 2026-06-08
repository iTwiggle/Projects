"use client";

import { useState } from "react";
import { BookmarkPlus, RotateCcw } from "lucide-react";
import { analyzeDeal } from "@/lib/analysis/engine";
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

  function handleAnalyze(input: DealInput) {
    setPreview({ input, saved: false });
  }

  function handleSave() {
    if (!preview) return;
    onSave(preview.input);
    setPreview({ ...preview, saved: true });
  }

  function handleReset() {
    setPreview(null);
  }

  function handleEditSubmit(input: DealInput) {
    if (editingDeal) {
      onEdit(editingDeal.id, input);
      onClearEdit();
    }
  }

  const analysis = preview ? analyzeDeal(preview.input) : null;
  const verdict = preview && analysis ? getGoblinVerdict(preview.input, analysis) : null;

  return (
    <div className="space-y-6">
      <DealForm onSubmit={handleAnalyze} />

      {preview && analysis && verdict && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Analysis: {preview.input.itemName}
            </h2>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="size-3.5" aria-hidden />
              Clear
            </Button>
          </div>

          <AnalysisMetrics analysis={analysis} />
          <GoblinVerdict verdict={verdict} />

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
