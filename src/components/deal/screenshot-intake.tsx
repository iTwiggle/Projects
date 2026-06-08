"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  FileImage,
  Loader2,
  RotateCcw,
  ScanLine,
  ScanText,
} from "lucide-react";
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
import { ExtractionConfidenceBar } from "@/components/deal/extraction-confidence";
import { cleanupOcrText } from "@/lib/intake/ocr-text-cleanup";
import {
  extractTextFromScreenshot,
  isOcrAvailable,
  type OcrProgress,
} from "@/lib/intake/screenshot-ocr";
import {
  DEFAULT_CONFIDENCE,
  DEFAULT_EXTRACTED,
  type ExtractedListingFields,
  type ExtractionConfidence,
  extractedToDealPartial,
  isExtractedEmpty,
  parseListingWithConfidence,
} from "@/lib/intake/listing-parser";
import type { DealInput } from "@/lib/types/deal";
import { DEAL_CATEGORIES, DEAL_CONDITIONS } from "@/lib/types/deal";

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
  const [rawOcrText, setRawOcrText] = useState("");
  const [listingText, setListingText] = useState("");
  const [showOriginalOcr, setShowOriginalOcr] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedListingFields>({
    ...DEFAULT_EXTRACTED,
  });
  const [confidence, setConfidence] = useState<ExtractionConfidence>({
    ...DEFAULT_CONFIDENCE,
  });
  const [hasParsed, setHasParsed] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress>(IDLE_OCR_PROGRESS);
  const [ocrNotice, setOcrNotice] = useState<string | null>(null);
  const [cleanupNotice, setCleanupNotice] = useState<string | null>(null);
  const [ocrSupported] = useState(() => isOcrAvailable());

  const isOcrRunning =
    ocrProgress.status === "checking" ||
    ocrProgress.status === "loading" ||
    ocrProgress.status === "recognizing";

  const hasIntakeData =
    !!imagePreviewUrl ||
    !!listingText.trim() ||
    hasParsed ||
    !!rawOcrText;

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
    setCleanupNotice(null);
    setHasParsed(false);
    e.target.value = "";
  }

  function clearIntake() {
    ocrAbortRef.current = true;
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setRawOcrText("");
    setListingText("");
    setShowOriginalOcr(false);
    setExtracted({ ...DEFAULT_EXTRACTED });
    setConfidence({ ...DEFAULT_CONFIDENCE });
    setHasParsed(false);
    setOcrProgress(IDLE_OCR_PROGRESS);
    setOcrNotice(null);
    setCleanupNotice(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleOcrExtract() {
    if (!imagePreviewUrl || isOcrRunning) return;

    ocrAbortRef.current = false;
    setOcrNotice(null);
    setCleanupNotice(null);
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

    const cleanup = cleanupOcrText(result.text);
    setRawOcrText(cleanup.original);
    setListingText(cleanup.cleaned);
    setHasParsed(false);
    setShowOriginalOcr(false);

    setOcrNotice(
      "OCR text loaded — review cleaned text below, then extract fields."
    );
    setCleanupNotice(
      cleanup.wasModified
        ? "Goblin cleanup fixed line breaks and common OCR typos. View original OCR if needed."
        : null
    );
  }

  function handleParseText() {
    const parsed = parseListingWithConfidence(listingText);
    setExtracted(parsed.fields);
    setConfidence(parsed.confidence);
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
    const result = hasParsed
      ? { fields: extracted, confidence }
      : parseListingWithConfidence(listingText);

    if (!hasParsed) {
      setExtracted(result.fields);
      setConfidence(result.confidence);
      setHasParsed(true);
    }

    if (isExtractedEmpty(result.fields)) return;
    onRequestFill(extractedToDealPartial(result.fields));
  }

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="space-y-2 px-4 pb-3 pt-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="size-5 shrink-0 text-sky-400" aria-hidden />
            Upload Screenshot
          </CardTitle>
          {hasIntakeData && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground"
              onClick={clearIntake}
              disabled={isOcrRunning}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Clear Intake
            </Button>
          )}
        </div>
        <CardDescription className="text-sm leading-relaxed">
          Upload a listing screenshot, extract text with goblin OCR, review and
          correct fields, then fill the analyze form. Image stays in memory only.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 px-4 pb-5 sm:space-y-6 sm:px-6 sm:pb-6">
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="screenshot-upload">Listing screenshot</Label>
              <Input
                id="screenshot-upload"
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className="cursor-pointer"
                onChange={handleFileChange}
              />
            </div>

            {imagePreviewUrl ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-xl border border-border/60 bg-background/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreviewUrl}
                    alt="Uploaded listing screenshot preview"
                    className="max-h-56 w-full object-contain sm:max-h-64"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-full sm:w-auto"
                  onClick={handleOcrExtract}
                  disabled={isOcrRunning}
                >
                  {isOcrRunning ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <ScanLine className="size-4" aria-hidden />
                  )}
                  Extract Text from Screenshot
                </Button>

                {isOcrRunning && (
                  <div className="space-y-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {ocrProgress.message}
                      </span>
                      <span className="shrink-0 font-medium text-sky-400">
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
                  <p className="text-xs leading-relaxed text-emerald-400">
                    {ocrProgress.message}
                  </p>
                )}

                {ocrProgress.status === "error" && ocrNotice && (
                  <p className="text-xs leading-relaxed text-amber-400">
                    {ocrNotice}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-background/30 px-4 py-12 text-center sm:py-14">
                <FileImage
                  className="size-8 text-muted-foreground/50"
                  aria-hidden
                />
                <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                  Upload a screenshot, then extract text or paste manually
                </p>
              </div>
            )}

            {!ocrSupported && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                OCR may be unavailable here — you can still paste listing text
                manually.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="listing-text">Listing text for parsing</Label>
              {rawOcrText && rawOcrText !== listingText && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground"
                  onClick={() => setShowOriginalOcr((prev) => !prev)}
                >
                  {showOriginalOcr ? (
                    <ChevronUp className="size-3.5" aria-hidden />
                  ) : (
                    <ChevronDown className="size-3.5" aria-hidden />
                  )}
                  {showOriginalOcr ? "Hide" : "View"} original OCR
                </Button>
              )}
            </div>

            {showOriginalOcr && rawOcrText && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Original OCR (read-only)
                </p>
                <Textarea
                  readOnly
                  value={rawOcrText}
                  rows={5}
                  className="min-h-[7rem] resize-none bg-background/40 text-xs text-muted-foreground"
                />
              </div>
            )}

            <Textarea
              id="listing-text"
              placeholder={`Paste or OCR listing text here...\n\nExample:\nMakita 18V Drill Kit\n$45 OBO · Good condition\nPickup only. Includes 2 batteries.`}
              rows={10}
              value={listingText}
              onChange={(e) => {
                setListingText(e.target.value);
                setHasParsed(false);
              }}
              className="min-h-[11rem] sm:min-h-[12rem]"
            />

            {ocrNotice && ocrProgress.status !== "error" && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {ocrNotice}
              </p>
            )}
            {cleanupNotice && (
              <p className="text-xs leading-relaxed text-sky-400/90">
                {cleanupNotice}
              </p>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 w-full sm:w-auto"
              onClick={handleParseText}
              disabled={!listingText.trim() || isOcrRunning}
            >
              <ScanText className="size-4" aria-hidden />
              Extract Fields
            </Button>
          </div>
        </div>

        {hasParsed && (
          <div className="space-y-4 rounded-xl border border-border/60 bg-background/30 p-4 sm:p-5">
            <div className="space-y-3">
              <p className="text-sm font-medium">Review & correct fields</p>
              <ExtractionConfidenceBar confidence={confidence} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            onClick={handleFillForm}
            disabled={
              isOcrRunning ||
              (!listingText.trim() && isExtractedEmpty(extracted))
            }
            className="h-11 w-full bg-sky-600 text-white hover:bg-sky-500 sm:w-auto"
          >
            Fill Analyze Form
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
