"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Radio, Store } from "lucide-react";
import { ExtractionConfidenceBar } from "@/components/deal/extraction-confidence";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  EXTENSION_LISTING_IMPORT_MESSAGE_TYPE,
  EXTENSION_LISTING_LISTEN_TIMEOUT_MS,
  isTrustedExtensionListingImportOrigin,
  postExtensionListingImportAck,
  validateExtensionListingImportMessage,
} from "@/lib/extension/listing-import-bridge";
import {
  marketplaceListingBatchToDealPartial,
  marketplaceListingBatchToExtractedFields,
} from "@/lib/intake/marketplace-listing-capture-import";
import {
  type ExtractedListingFields,
  type ExtractionConfidence,
  extractedToDealPartial,
  isExtractedEmpty,
} from "@/lib/intake/listing-parser";
import type { DealInput } from "@/lib/types/deal";
import { DEAL_CATEGORIES, DEAL_CONDITIONS } from "@/lib/types/deal";
import type { IntakeExtractionSource } from "@/lib/types/intake-source";
import type { ItemIdentitySources } from "@/lib/types/item-identity";
import type { MarketplaceListingCaptureBatch } from "@/lib/types/marketplace-listing-capture";
import { cn } from "@/lib/utils";

interface ListingExtensionIntakeProps {
  onRequestFill: (
    proposed: Partial<DealInput>,
    meta: { source: IntakeExtractionSource }
  ) => void;
  onIdentitySourcesChange?: (sources: ItemIdentitySources) => void;
}

export function ListingExtensionIntake({
  onRequestFill,
  onIdentitySourcesChange,
}: ListingExtensionIntakeProps) {
  const listenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listeningRef = useRef(false);
  const [listening, setListening] = useState(false);
  const [listenNotice, setListenNotice] = useState<string | null>(null);
  const [pendingBatch, setPendingBatch] =
    useState<MarketplaceListingCaptureBatch | null>(null);
  const [extracted, setExtracted] = useState<ExtractedListingFields>({
    itemName: "",
    askingPrice: 0,
    condition: "Good",
    category: "Other",
    notes: "",
  });
  const [confidence, setConfidence] = useState<ExtractionConfidence>({
    itemName: "low",
    askingPrice: "low",
    condition: "low",
    category: "low",
  });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [listingUrl, setListingUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [hasReview, setHasReview] = useState(false);

  const clearListenTimeout = useCallback(() => {
    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
    }
  }, []);

  const stopListening = useCallback(
    (notice?: string) => {
      clearListenTimeout();
      listeningRef.current = false;
      setListening(false);
      if (notice !== undefined) {
        setListenNotice(notice);
      }
    },
    [clearListenTimeout]
  );

  const scheduleListenTimeout = useCallback(() => {
    clearListenTimeout();
    listenTimeoutRef.current = setTimeout(() => {
      stopListening("Extension listen timed out after inactivity.");
    }, EXTENSION_LISTING_LISTEN_TIMEOUT_MS);
  }, [clearListenTimeout, stopListening]);

  const applyBatchToReview = useCallback(
    (batch: MarketplaceListingCaptureBatch) => {
      const { fields, confidence: nextConfidence, warnings: nextWarnings } =
        marketplaceListingBatchToExtractedFields(batch);

      setPendingBatch(batch);
      setExtracted(fields);
      setConfidence(nextConfidence);
      setWarnings(nextWarnings);
      setImageUrl(batch.listing.imageUrl ?? null);
      setListingUrl(batch.listing.listingUrl);
      setRawText(batch.listing.rawText);
      setHasReview(true);
    },
    []
  );

  const startListening = useCallback(() => {
    listeningRef.current = true;
    setListening(true);
    setListenNotice(
      "Listening for Facebook listing capture — open a Marketplace item page in the extension, capture, then Send to Goblin."
    );
    scheduleListenTimeout();
  }, [scheduleListenTimeout]);

  useEffect(() => {
    if (!onIdentitySourcesChange) return;
    if (!rawText.trim()) {
      onIdentitySourcesChange({});
      return;
    }
    onIdentitySourcesChange({ listingText: rawText });
  }, [onIdentitySourcesChange, rawText]);

  useEffect(() => {
    function handleExtensionMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (
        !isTrustedExtensionListingImportOrigin(
          event.origin,
          window.location.origin
        )
      ) {
        return;
      }
      if (event.data?.type !== EXTENSION_LISTING_IMPORT_MESSAGE_TYPE) return;

      if (!listeningRef.current) {
        postExtensionListingImportAck(
          false,
          "Marketplace Goblin is not listening for extension listing import."
        );
        return;
      }

      scheduleListenTimeout();

      const { batch, error } = validateExtensionListingImportMessage(event.data);
      if (error || !batch) {
        postExtensionListingImportAck(false, error ?? "Invalid listing batch.");
        setListenNotice(error ?? "Rejected malformed listing batch.");
        return;
      }

      postExtensionListingImportAck(true);
      applyBatchToReview(batch);
      setListenNotice(
        "Listing received from extension — review fields below, then fill the analyze form."
      );
    }

    window.addEventListener("message", handleExtensionMessage);
    return () => window.removeEventListener("message", handleExtensionMessage);
  }, [applyBatchToReview, scheduleListenTimeout]);

  useEffect(() => () => clearListenTimeout(), [clearListenTimeout]);

  function updateExtracted<K extends keyof ExtractedListingFields>(
    key: K,
    value: ExtractedListingFields[K]
  ) {
    setExtracted((prev) => ({ ...prev, [key]: value }));
    setHasReview(true);
  }

  function handleFillForm() {
    if (!pendingBatch && isExtractedEmpty(extracted)) return;

    const proposed = pendingBatch
      ? marketplaceListingBatchToDealPartial({
          ...pendingBatch,
          listing: {
            ...pendingBatch.listing,
            title: extracted.itemName,
            askingPrice: extracted.askingPrice,
            description: extracted.notes,
            listingUrl,
            rawText,
          },
        }).proposed
      : extractedToDealPartial(extracted, { listingUrl: listingUrl || null });

    if (isExtractedEmpty(extracted) && !listingUrl) return;

    onRequestFill(
      {
        ...proposed,
        itemName: extracted.itemName,
        askingPrice: extracted.askingPrice,
        condition: extracted.condition,
        category: extracted.category,
        notes: extracted.notes,
        listingUrl: listingUrl || proposed.listingUrl || null,
      },
      { source: "extension" }
    );
  }

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="space-y-2 px-4 pb-3 pt-5 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Store className="size-5 shrink-0 text-blue-400" aria-hidden />
          Extension Listing Import
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          Capture a Facebook Marketplace listing with the extension, send it
          here, review extracted fields, then fill the analyze form. Never
          overwrites existing form fields without confirmation.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-5 sm:px-6 sm:pb-6">
        {listening && (
          <div
            className="space-y-2 rounded-lg border border-blue-500/40 bg-blue-500/10 p-3"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-200">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-blue-400" />
                </span>
                Listening for extension listing import
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => stopListening("Extension listen cancelled.")}
              >
                Cancel
              </Button>
            </div>
            {listenNotice && (
              <p className="text-xs text-blue-100/90">{listenNotice}</p>
            )}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full",
            listening && "border-blue-500/40 bg-blue-500/10 text-blue-200"
          )}
          onClick={() =>
            listening
              ? stopListening("Extension listen cancelled.")
              : startListening()
          }
          aria-pressed={listening}
        >
          <Radio className="size-4" aria-hidden />
          {listening
            ? "Stop listening for extension listing"
            : "Listen for extension listing import"}
        </Button>

        {hasReview && (
          <div className="space-y-4 rounded-xl border border-border/60 bg-background/30 p-4 sm:p-5">
            <div className="space-y-3">
              <p className="text-sm font-medium">Review captured listing</p>
              <ExtractionConfidenceBar
                confidence={confidence}
                source="extension"
              />
            </div>

            {warnings.length > 0 && (
              <ul className="space-y-1 text-xs text-amber-300">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}

            {imageUrl && (
              <div className="overflow-hidden rounded-xl border border-border/60 bg-background/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Captured listing preview"
                  className="max-h-48 w-full object-contain"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="extension-listing-url">Listing URL</Label>
              <Input
                id="extension-listing-url"
                value={listingUrl}
                onChange={(e) => setListingUrl(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="extension-itemName">Item Name</Label>
                <Input
                  id="extension-itemName"
                  value={extracted.itemName}
                  onChange={(e) => updateExtracted("itemName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="extension-askingPrice">Asking Price ($)</Label>
                <Input
                  id="extension-askingPrice"
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
                <Label htmlFor="extension-condition">Condition</Label>
                <Select
                  value={extracted.condition}
                  onValueChange={(value) =>
                    updateExtracted(
                      "condition",
                      value as ExtractedListingFields["condition"]
                    )
                  }
                >
                  <SelectTrigger id="extension-condition" className="w-full">
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
                <Label htmlFor="extension-category">Category</Label>
                <Select
                  value={extracted.category}
                  onValueChange={(value) =>
                    updateExtracted(
                      "category",
                      value as ExtractedListingFields["category"]
                    )
                  }
                >
                  <SelectTrigger id="extension-category" className="w-full">
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
                <Label htmlFor="extension-notes">Notes / Description</Label>
                <Textarea
                  id="extension-notes"
                  rows={4}
                  value={extracted.notes}
                  onChange={(e) => updateExtracted("notes", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="extension-rawText">Captured visible text</Label>
                <Textarea
                  id="extension-rawText"
                  rows={5}
                  value={rawText}
                  readOnly
                  className="min-h-[7rem] resize-none bg-background/40 text-xs text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                onClick={handleFillForm}
                disabled={isExtractedEmpty(extracted) && !listingUrl}
                className="h-11 w-full bg-blue-600 text-white hover:bg-blue-500 sm:w-auto"
              >
                Fill Analyze Form
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
