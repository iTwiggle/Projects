"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, FileImage, Loader2, ScanLine, ScanText, X } from "lucide-react";
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
  extractTextFromScreenshot,
  isOcrAvailable,
  type OcrProgress,
} from "@/lib/intake/screenshot-ocr";
import {
  DEFAULT_EXTRACTED,
  type ExtractedListingFields,
  extractedToDealPartial,
  isExtractedEmpty,
  parseListingText,
} from "@/lib/intake/listing-parser";
import type { DealInput } from "@/lib/types/deal";
import { DEAL_CATEGORIES, DEAL_CONDITIONS } from "@/lib/types/deal";
import { cn } from "@/lib/utils";

interface ScreenshotIntakeProps {
  onRequestFill: (proposed: Partial<DealInput>) => void;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const IDLE_OCR_PROGRESS: OcrProgress = {
  status: "idle",
  progress: 0,
  message: "",
};

export function ScreenshotIntake({ onRequestFill }: ScreenshotIntakeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrAbortRef = useRef(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [listingText, setListingText] = useState("");
  const [extracted, setExtracted] = useState<ExtractedListingFields>({
    ...DEFAULT_EXTRACTED,
  });
  const [hasParsed, setHasParsed] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress>(IDLE_OCR_PROGRESS);
  const [ocrNotice, setOcrNotice] = useState<string | null>(null);
  const [ocrSupported] = useState(() => isOcrAvailable());

  const isOcrRunning =
    ocrProgress.status === "checking" ||
    ocrProgress.status === "loading" ||
    ocrProgress.status === "recognizing";

  useEffect(() => {
    return () => {
      ocrAbortRef.current = true;
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) return;

    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(URL.createObjectURL(file));
    setOcrProgress(IDLE_OCR_PROGRESS);
    setOcrNotice(null);
    setHasParsed(false);
    e.target.value = "";
  }

  function clearImage() {
    ocrAbortRef.current = true;
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setOcrProgress(IDLE_OCR_PROGRESS);
    setOcrNotice(null);
  }

  async function handleOcrExtract() {
    if (!imagePreviewUrl || isOcrRunning) return;

    ocrAbortRef.current = false;
    setOcrNotice(null);
    setOcrProgress({
      status: "checking",
      progress: 0,
      message: "Preparing goblin vision...",
    });

    const result = await extractTextFromScreenshot(imagePreviewUrl, (update) => {
      if (!ocrAbortRef.current) setOcrProgress(update);
    });

    if (ocrAbortRef.current) return;

    if ("fallback" in result) {
      setOcrProgress({
        status: "error",
        progress: 0,
        message: result.message,
      });
      setOcrNotice(result.message);
      return;
    }

    setListingText(result.text);
    setHasParsed(false);
    setOcrNotice(
      "OCR text loaded below — review, edit, then extract fields or fill the form."
    );
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
          Upload a listing screenshot, extract text with goblin OCR, review it,
          then fill the analyze form. Image stays in memory only.
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
                    disabled={isOcrRunning}
                  >
                    <X className="size-3.5" aria-hidden />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {imagePreviewUrl ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-xl border border-border/60 bg-background/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreviewUrl}
                    alt="Uploaded listing screenshot preview"
                    className="max-h-64 w-full object-contain"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={handleOcrExtract}
                  disabled={isOcrRunning}
                >
                  {isOcrRunning ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <ScanLine className="size-3.5" aria-hidden />
                  )}
                  Extract Text from Screenshot
                </Button>

                {isOcrRunning && (
                  <div className="space-y-2 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {ocrProgress.message}
                      </span>
                      <span className="font-medium text-sky-400">
                        {Math.round(ocrProgress.progress * 100)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-background/60">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all duration-300"
                        style={{
                          width: `${Math.max(4, Math.round(ocrProgress.progress * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {ocrProgress.status === "done" && !isOcrRunning && (
                  <p className="text-xs text-emerald-400">{ocrProgress.message}</p>
                )}

                {ocrProgress.status === "error" && ocrNotice && (
                  <p className="text-xs text-amber-400">{ocrNotice}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-background/30 px-4 py-10 text-center">
                <FileImage
                  className="size-8 text-muted-foreground/50"
                  aria-hidden
                />
                <p className="text-xs text-muted-foreground">
                  Upload a screenshot, then extract text or paste manually
                </p>
              </div>
            )}

            {!ocrSupported && (
              <p className="text-xs text-muted-foreground">
                OCR may be unavailable here — you can still paste listing text
                manually.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="listing-text">Paste listing text</Label>
            <Textarea
              id="listing-text"
              placeholder={`Paste or OCR listing text here...\n\nExample:\nMakita 18V Drill Kit\n$45 · Good condition\nIncludes 2 batteries. Pickup only.`}
              rows={10}
              value={listingText}
              onChange={(e) => {
                setListingText(e.target.value);
                setHasParsed(false);
              }}
              className="min-h-[12rem]"
            />
            {ocrNotice && ocrProgress.status !== "error" && (
              <p className={cn("text-xs", "text-muted-foreground")}>
                {ocrNotice}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleParseText}
              disabled={!listingText.trim() || isOcrRunning}
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
            disabled={
              isOcrRunning ||
              (!listingText.trim() && isExtractedEmpty(extracted))
            }
            className="bg-sky-600 text-white hover:bg-sky-500"
          >
            Fill Analyze Form
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
