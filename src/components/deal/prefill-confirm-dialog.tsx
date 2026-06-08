"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  getConflictingFields,
  getCurrentValue,
  getFieldLabel,
  getProposedValue,
  mergePrefill,
  type PrefillableField,
} from "@/lib/intake/listing-parser";
import type { DealInput } from "@/lib/types/deal";

interface PrefillConfirmDialogProps {
  open: boolean;
  current: DealInput;
  proposed: Partial<DealInput>;
  touchedFields: Set<PrefillableField>;
  onConfirm: (merged: DealInput) => void;
  onCancel: () => void;
}

export function PrefillConfirmDialog({
  open,
  current,
  proposed,
  touchedFields,
  onConfirm,
  onCancel,
}: PrefillConfirmDialogProps) {
  const conflicts = getConflictingFields(current, proposed, touchedFields);
  const [overwriteFields, setOverwriteFields] = useState<Set<PrefillableField>>(
    new Set()
  );

  function toggleField(field: PrefillableField, checked: boolean) {
    setOverwriteFields((prev) => {
      const next = new Set(prev);
      if (checked) next.add(field);
      else next.delete(field);
      return next;
    });
  }

  function handleConfirm() {
    onConfirm(mergePrefill(current, proposed, overwriteFields, touchedFields));
    setOverwriteFields(new Set());
  }

  function handleCancel() {
    setOverwriteFields(new Set());
    onCancel();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm form fill</DialogTitle>
          <DialogDescription>
            Some analyze fields already have values. Choose which fields to
            overwrite. Resale value stays blank for Quick Estimate.
          </DialogDescription>
        </DialogHeader>

        {conflicts.length > 0 ? (
          <div className="space-y-3">
            {conflicts.map((field) => (
              <div
                key={field}
                className="rounded-lg border border-border/60 bg-background/40 p-3"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`overwrite-${field}`}
                    checked={overwriteFields.has(field)}
                    onCheckedChange={(checked) =>
                      toggleField(field, checked === true)
                    }
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Label
                      htmlFor={`overwrite-${field}`}
                      className="text-sm font-medium"
                    >
                      Replace {getFieldLabel(field)}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Current: {getCurrentValue(current, field)}
                    </p>
                    <p className="text-xs text-emerald-400">
                      From listing: {getProposedValue(proposed, field)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Empty fields will be filled from the listing. No conflicts detected.
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            Fill Analyze Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
