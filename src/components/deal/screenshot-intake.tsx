"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, FileImage, ScanText, X } from "lucide-react";
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
  type DealInput,
} from "@/lib/types/deal";
import {
  DEFAULT_EXTRACTED,
  type ExtractedListingFields,
  extractedToDealPartial,
  isExtractedEmpty,
  parseListingText,
} from "@/lib/intake/listing-parser";

interface ScreenshotIntakeProps {
  onRequestFill: (proposed: Partial<DealInput>) => void;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export function ScreenshotIntake({ onRequestFill }: ScreenshotIntakeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [listingText, setListingText] = useState("");
  const [extracted, setExtracted] = useState<ExtractedListingFields>({
    ...DEFAULT_EXTRACTED,
  });
  const [hasParsed, setHasParsed] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) return;

    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(URL.createObjectURL(file));
    e.target.value = "";
  }

  function clearImage() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
  }

  function handleParseText() {
    const parsed = parseListingText(listingText);
    setExtracted(parsed);
    setHasParsed(true);
  }

  function updateExtracted<K extends keyof ExtractedListingFields>(
    key: K,
    value: ExtractedListingFields[K]
  ) {
    setExtracted((prev) => ({ ...prev, [key]: value }));
    setHasParsed(true);
  }

  function handleFillForm() {
    const fields = hasParsed ? extracted : parseListingText(listingText);

    if (!hasParsed) {
      setExtracted(fields);
      setHasParsed(true);
    }

    if (isExtractedEmpty(fields)) return;
    onRequestFill(extractedToDealPartial(fields));
  }

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="size-5 text-sky-400" aria-hidden />
          Upload Screenshot
        </CardTitle>
        <CardDescription>
          Drop in a Marketplace screenshot, paste the listing text, confirm the
          fields, then fill the analyze form. Image stays in memory only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="screenshot-upload">Listing screenshot</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="screenshot-upload"
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  className="cursor-pointer"
                  onChange={handleFileChange}
                />
                {imagePreviewUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearImage}
                  >
                    <X className="size-3.5" aria-hidden />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {imagePreviewUrl ? (
              <div className="overflow-hidden rounded-xl border border-border/60 bg-background/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreviewUrl}
                  alt="Uploaded listing screenshot preview"
                  className="max-h-64 w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-background/30 px-4 py-10 text-center">
                <FileImage
                  className="size-8 text-muted-foreground/50"
                  aria-hidden
                />
                <p className="text-xs text-muted-foreground">
                  Upload a screenshot for reference while you type
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="listing-text">Paste listing text</Label>
            <Textarea
              id="listing-text"
              placeholder={`Paste title, price, and description from the listing...\n\nExample:\nMakita 18V Drill Kit\n$45 · Good condition\nIncludes 2 batteries. Pickup only.`}
              rows={10}
              value={listingText}
              onChange={(e) => setListingText(e.target.value)}
              className="min-h-[12rem]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleParseText}
              disabled={!listingText.trim()}
            >
              <ScanText className="size-3.5" aria-hidden />
              Extract Fields
            </Button>
          </div>
        </div>

        {hasParsed && (
          <div className="space-y-3 rounded-xl border border-border/60 bg-background/30 p-4">
            <p className="text-sm font-medium">Review extracted fields</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="extracted-itemName">Item Name</Label>
                <Input
                  id="extracted-itemName"
                  value={extracted.itemName}
                  onChange={(e) => updateExtracted("itemName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="extracted-askingPrice">Asking Price ($)</Label>
                <Input
                  id="extracted-askingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={extracted.askingPrice || ""}
                  onChange={(e) =>
                    updateExtracted(
                      "askingPrice",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="extracted-condition">Condition</Label>
                <Select
                  value={extracted.condition}
                  onValueChange={(value) =>
                    updateExtracted(
                      "condition",
                      value as ExtractedListingFields["condition"]
                    )
                  }
                >
                  <SelectTrigger id="extracted-condition" className="w-full">
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
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="extracted-category">Category</Label>
                <Select
                  value={extracted.category}
                  onValueChange={(value) =>
                    updateExtracted(
                      "category",
                      value as ExtractedListingFields["category"]
                    )
                  }
                >
                  <SelectTrigger id="extracted-category" className="w-full">
                    <SelectValue />
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
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="extracted-notes">Notes / Description</Label>
                <Textarea
                  id="extracted-notes"
                  rows={3}
                  value={extracted.notes}
                  onChange={(e) => updateExtracted("notes", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleFillForm}
            disabled={!listingText.trim() && isExtractedEmpty(extracted)}
            className="bg-sky-600 text-white hover:bg-sky-500"
          >
            Fill Analyze Form
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
