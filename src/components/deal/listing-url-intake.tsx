"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Link2,
  Loader2,
  RotateCcw,
  Wand2,
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
import { attemptListingAutofill } from "@/lib/intake/listing-autofill";
import { isValidListingUrl } from "@/lib/intake/listing-url";
import {
  DEFAULT_CONFIDENCE,
  DEFAULT_EXTRACTED,
  type ExtractedListingFields,
  type ExtractionConfidence,
  extractedToDealPartial,
  isExtractedEmpty,
} from "@/lib/intake/listing-parser";
import type { DealInput } from "@/lib/types/deal";
import { DEAL_CATEGORIES, DEAL_CONDITIONS } from "@/lib/types/deal";
import type { IntakeExtractionSource } from "@/lib/types/intake-source";

interface ListingUrlIntakeProps {
  listingUrl: string | null;
  onListingUrlChange: (url: string | null) => void;
  onRequestFill: (
    proposed: Partial<DealInput>,
    meta: { source: IntakeExtractionSource }
  ) => void;
}

export function ListingUrlIntake({
  listingUrl,
  onListingUrlChange,
  onRequestFill,
}: ListingUrlIntakeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [parserText, setParserText] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [extracted, setExtracted] = useState<ExtractedListingFields>({
    ...DEFAULT_EXTRACTED,
  });
  const [confidence, setConfidence] = useState<ExtractionConfidence>({
    ...DEFAULT_CONFIDENCE,
  });
  const [hasParsed, setHasParsed] = useState(false);

  const urlDraft = listingUrl ?? "";
  const urlError =
    urlDraft.trim().length > 0 && !isValidListingUrl(urlDraft)
      ? "Enter a valid http(s) listing URL"
      : null;

  function clearIntake() {
    setDiagnostics([]);
    setStatus("idle");
    setParserText("");
    setImageUrls([]);
    setExtracted({ ...DEFAULT_EXTRACTED });
    setConfidence({ ...DEFAULT_CONFIDENCE });
    setHasParsed(false);
  }

  async function handleAttemptAutofill() {
    if (!urlDraft.trim() || urlError || isLoading) return;

    setIsLoading(true);
    setStatus("idle");
    setDiagnostics([]);
    setHasParsed(false);

    const result = await attemptListingAutofill(urlDraft.trim());
    setDiagnostics(result.diagnostics);
    setParserText(result.parserText);
    setImageUrls(result.imageUrls);

    if (result.listingUrl) {
      onListingUrlChange(result.listingUrl);
    }

    if (result.success && result.parseResult) {
      setExtracted(result.parseResult.fields);
      setConfidence(result.parseResult.confidence);
      setHasParsed(true);
      setStatus("success");
    } else {
      setStatus("error");
    }

    setIsLoading(false);
  }

  function updateExtracted<K extends keyof ExtractedListingFields>(
    key: K,
    value: ExtractedListingFields[K]
  ) {
    setExtracted((prev) => ({ ...prev, [key]: value }));
    setHasParsed(true);
  }

  function handleFillForm() {
    if (!hasParsed || isExtractedEmpty(extracted)) return;

    onRequestFill(
      extractedToDealPartial(extracted, { listingUrl: listingUrl ?? urlDraft }),
      { source: "url_autofill" }
    );
  }

  const hasData = status !== "idle" || hasParsed || !!parserText;

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="space-y-2 px-4 pb-3 pt-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="size-5 shrink-0 text-violet-400" aria-hidden />
            Listing URL Autofill
          </CardTitle>
          {hasData && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground"
              onClick={clearIntake}
              disabled={isLoading}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Clear
            </Button>
          )}
        </div>
        <CardDescription className="text-sm leading-relaxed">
          Paste a listing link and attempt autofill when the browser allows
          CORS. No backend, proxies, or scraping services — metadata only.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-5 sm:px-6 sm:pb-6">
        <div className="space-y-2">
          <Label htmlFor="listing-url-autofill">Listing URL</Label>
          <Input
            id="listing-url-autofill"
            type="url"
            inputMode="url"
            placeholder="https://www.facebook.com/marketplace/item/..."
            value={urlDraft}
            onChange={(e) =>
              onListingUrlChange(
                e.target.value.trim() === "" ? null : e.target.value
              )
            }
            aria-invalid={urlError ? true : undefined}
          />
          {urlError && <p className="text-xs text-rose-400">{urlError}</p>}
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-10 w-full sm:w-auto"
          onClick={handleAttemptAutofill}
          disabled={!urlDraft.trim() || !!urlError || isLoading}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Wand2 className="size-4" aria-hidden />
          )}
          Attempt Autofill
        </Button>

        {diagnostics.length > 0 && (
          <div className="space-y-2 rounded-xl border border-border/60 bg-background/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Diagnostics
            </p>
            <ul className="space-y-1">
              {diagnostics.map((line) => (
                <li
                  key={line}
                  className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                >
                  {status === "success" && line.includes("parser") ? (
                    <CheckCircle2
                      className="mt-0.5 size-3.5 shrink-0 text-emerald-400"
                      aria-hidden
                    />
                  ) : status === "error" ? (
                    <AlertCircle
                      className="mt-0.5 size-3.5 shrink-0 text-amber-400"
                      aria-hidden
                    />
                  ) : null}
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {status === "error" && (
          <p className="text-xs leading-relaxed text-amber-400">
            Autofill could not complete. Use screenshot OCR or paste listing
            text manually below.
          </p>
        )}

        {imageUrls.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Preview images (from page metadata)
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {imageUrls.map((src) => (
                <div
                  key={src}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-background/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt="Listing preview"
                    className="size-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {parserText && (
          <div className="space-y-1.5">
            <Label htmlFor="autofill-parser-text">Extracted text for parser</Label>
            <Textarea
              id="autofill-parser-text"
              readOnly
              rows={4}
              value={parserText}
              className="resize-none bg-background/40 text-xs text-muted-foreground"
            />
          </div>
        )}

        {hasParsed && (
          <div className="space-y-4 rounded-xl border border-border/60 bg-background/30 p-4">
            <ExtractionConfidenceBar
              confidence={confidence}
              source="url_autofill"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="url-itemName">Item Name</Label>
                <Input
                  id="url-itemName"
                  value={extracted.itemName}
                  onChange={(e) => updateExtracted("itemName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url-askingPrice">Asking Price ($)</Label>
                <Input
                  id="url-askingPrice"
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
                <Label htmlFor="url-condition">Condition</Label>
                <Select
                  value={extracted.condition}
                  onValueChange={(value) => {
                    if (value) {
                      updateExtracted(
                        "condition",
                        value as ExtractedListingFields["condition"]
                      );
                    }
                  }}
                >
                  <SelectTrigger id="url-condition" className="w-full">
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
                <Label htmlFor="url-category">Category</Label>
                <Select
                  value={extracted.category}
                  onValueChange={(value) => {
                    if (value) {
                      updateExtracted(
                        "category",
                        value as ExtractedListingFields["category"]
                      );
                    }
                  }}
                >
                  <SelectTrigger id="url-category" className="w-full">
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
                <Label htmlFor="url-notes">Notes / Description</Label>
                <Textarea
                  id="url-notes"
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
            disabled={!hasParsed || isExtractedEmpty(extracted) || isLoading}
            className="h-11 w-full bg-violet-600 text-white hover:bg-violet-500 sm:w-auto"
          >
            Fill Analyze Form
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
