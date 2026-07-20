"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PrefillableField } from "@/lib/intake/listing-parser";
import {
  DEAL_CATEGORIES,
  DEAL_CONDITIONS,
  EMPTY_DEAL_INPUT,
  normalizeDealInput,
  type DealInput,
} from "@/lib/types/deal";

interface DealFormProps {
  value?: DealInput;
  onChange?: (input: DealInput) => void;
  onFieldTouched?: (field: PrefillableField) => void;
  initialValues?: DealInput;
  submitLabel?: string;
  onSubmit: (input: DealInput) => void;
  onCancel?: () => void;
}

export function DealForm({
  value,
  onChange,
  onFieldTouched,
  initialValues,
  submitLabel = "Analyze Deal",
  onSubmit,
  onCancel,
}: DealFormProps) {
  const isControlled = value !== undefined && onChange !== undefined;
  const [internalForm, setInternalForm] = useState<DealInput>(
    () => value ?? initialValues ?? EMPTY_DEAL_INPUT
  );

  const form = isControlled ? value : internalForm;

  function setForm(next: DealInput) {
    if (isControlled) onChange(next);
    else setInternalForm(next);
  }

  function updateField<K extends keyof DealInput>(
    key: K,
    fieldValue: DealInput[K]
  ) {
    setForm({ ...form, [key]: fieldValue });
    if (
      onFieldTouched &&
      (key === "itemName" ||
        key === "askingPrice" ||
        key === "condition" ||
        key === "category" ||
        key === "notes")
    ) {
      onFieldTouched(key);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.itemName.trim()) return;
    onSubmit(normalizeDealInput(form));
  }

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="size-5 text-emerald-400" aria-hidden />
          Evaluate a Deal
        </CardTitle>
        <CardDescription>
          Spot a listing? Enter what you know — the goblin estimates resale if
          you don&apos;t have comps yet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              placeholder="e.g. Vintage Le Creuset Dutch Oven"
              value={form.itemName}
              onChange={(e) => updateField("itemName", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(fieldValue) =>
                  updateField("category", fieldValue as DealInput["category"])
                }
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Estimated Condition</Label>
              <Select
                value={form.condition}
                onValueChange={(fieldValue) =>
                  updateField("condition", fieldValue as DealInput["condition"])
                }
              >
                <SelectTrigger id="condition" className="w-full">
                  <SelectValue placeholder="Select condition" />
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="askingPrice">Asking Price ($)</Label>
              <Input
                id="askingPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={form.askingPrice || ""}
                onChange={(e) =>
                  updateField("askingPrice", parseFloat(e.target.value) || 0)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="knownResaleValue">
                Optional Known Resale Value ($)
              </Label>
              <Input
                id="knownResaleValue"
                type="number"
                min="0"
                step="0.01"
                placeholder="Leave blank for estimate"
                value={form.knownResaleValue ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  updateField(
                    "knownResaleValue",
                    raw === "" ? null : parseFloat(raw) || 0
                  );
                }}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank for a rough goblin estimate.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Brand, model, defects, seller motivation — more detail = better estimate"
              rows={3}
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <Sparkles className="size-4" aria-hidden />
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
