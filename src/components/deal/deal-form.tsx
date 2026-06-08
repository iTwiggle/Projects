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
import {
  DEAL_CATEGORIES,
  DEAL_CONDITIONS,
  EMPTY_DEAL_INPUT,
  type DealInput,
} from "@/lib/types/deal";

interface DealFormProps {
  initialValues?: DealInput;
  submitLabel?: string;
  onSubmit: (input: DealInput) => void;
  onCancel?: () => void;
}

export function DealForm({
  initialValues,
  submitLabel = "Analyze Deal",
  onSubmit,
  onCancel,
}: DealFormProps) {
  const [form, setForm] = useState<DealInput>(
    () => initialValues ?? EMPTY_DEAL_INPUT
  );

  function updateField<K extends keyof DealInput>(
    key: K,
    value: DealInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.itemName.trim()) return;
    onSubmit(form);
  }

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="size-5 text-emerald-400" aria-hidden />
          Evaluate a Deal
        </CardTitle>
        <CardDescription>
          Enter listing details from Facebook Marketplace, Craigslist, OfferUp,
          or anywhere you hunt.
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
                onValueChange={(value) =>
                  updateField("category", value as DealInput["category"])
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
                onValueChange={(value) =>
                  updateField("condition", value as DealInput["condition"])
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
              <Label htmlFor="resaleValue">Estimated Resale Value ($)</Label>
              <Input
                id="resaleValue"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={form.estimatedResaleValue || ""}
                onChange={(e) =>
                  updateField(
                    "estimatedResaleValue",
                    parseFloat(e.target.value) || 0
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Seller motivation, defects, comparable sold prices, pickup distance..."
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
