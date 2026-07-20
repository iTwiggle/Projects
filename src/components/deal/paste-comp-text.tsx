"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardPaste, FileJson, Plus, Radio, X } from "lucide-react";
import {
  EXTENSION_IMPORT_LISTEN_TIMEOUT_MS,
  EXTENSION_IMPORT_MESSAGE_TYPE,
  isTrustedExtensionImportOrigin,
  postExtensionImportAck,
  validateExtensionImportMessage,
} from "@/lib/extension/comp-import-bridge";
import type { CompCaptureBatch } from "@/lib/types/comp-capture";
import type { CompImportChannel } from "@/lib/storage/usage-telemetry";
import {
  isEbayCapturePlatform,
  recordCompImport,
  recordEbayCaptureImported,
  recordEbayCaptureReceived,
} from "@/lib/storage/usage-telemetry";
import {
  normalizeCapturedComps,
  parseCompCaptureJson,
  tryParseCompCaptureBatch,
} from "@/lib/intake/comp-capture-import";
import type { NormalizeCapturedCompsResult } from "@/lib/types/comp-capture";
import {
  isValidCompDraft,
  parseCompTextBatch,
  parsedCompDraftToComparable,
  type ParsedCompDraft,
} from "@/lib/intake/comp-text-parser";
import type { FieldConfidence } from "@/lib/intake/listing-parser";
import {
  COMP_PLATFORMS,
  generateCompId,
  type ComparableSale,
  type CompListingType,
} from "@/lib/types/comps";
import { DEAL_CONDITIONS } from "@/lib/types/deal";
import type { ItemIdentity } from "@/lib/types/item-identity";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

interface PasteCompTextProps {
  onImport: (comps: ComparableSale[]) => void;
  existingComps?: ComparableSale[];
  itemIdentity?: ItemIdentity | null;
  compSearchQuery?: string | null;
}

const confidenceStyles: Record<FieldConfidence, string> = {
  low: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  high: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const listingTypeStyles = {
  sold: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  listed: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export function PasteCompText({
  onImport,
  existingComps = [],
  itemIdentity = null,
  compSearchQuery = null,
}: PasteCompTextProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listeningRef = useRef(false);
  const pendingCompImportRef = useRef<{
    channel: CompImportChannel;
    platform?: string;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [listenNotice, setListenNotice] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [drafts, setDrafts] = useState<ParsedCompDraft[]>([]);
  const [jsonImport, setJsonImport] = useState<NormalizeCapturedCompsResult | null>(
    null
  );
  const [parseNotice, setParseNotice] = useState<string | null>(null);

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
    }, EXTENSION_IMPORT_LISTEN_TIMEOUT_MS);
  }, [clearListenTimeout, stopListening]);

  function reset() {
    stopListening();
    setListenNotice(null);
    setPasteText("");
    setDrafts([]);
    setJsonImport(null);
    setParseNotice(null);
    setOpen(false);
    pendingCompImportRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const previewJsonBatch = useCallback(
    (batch: CompCaptureBatch, sourceLabel = "Batch", channel: CompImportChannel = "json") => {
      pendingCompImportRef.current = {
        channel,
        platform: batch.platform,
      };
      const result = normalizeCapturedComps(batch, {
        existingComps,
        itemIdentity,
        compSearchQuery: compSearchQuery ?? batch.searchQuery,
      });

      setJsonImport(result);
      setDrafts([]);
      setOpen(true);
      setParseNotice(
        result.comps.length > 0
          ? `${sourceLabel} ready — ${result.comps.length} comp${result.comps.length !== 1 ? "s" : ""} to import.`
          : `${sourceLabel} received, but no comps could be imported.`
      );
    },
    [compSearchQuery, existingComps, itemIdentity]
  );

  function previewJsonImport(text: string) {
    const parsed = parseCompCaptureJson(text);
    if (parsed.error || !parsed.batch) {
      setJsonImport(null);
      setDrafts([]);
      setParseNotice(parsed.error ?? "Invalid comp capture JSON.");
      return;
    }

    previewJsonBatch(parsed.batch, "JSON batch", "json");
  }

  const startListening = useCallback(() => {
    setOpen(true);
    listeningRef.current = true;
    setListening(true);
    setListenNotice(
      "Listening for extension import — capture comps in the extension, then click Send to Goblin."
    );
    setParseNotice(null);
    scheduleListenTimeout();
  }, [scheduleListenTimeout]);

  useEffect(() => {
    function handleExtensionMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (!isTrustedExtensionImportOrigin(event.origin, window.location.origin)) {
        return;
      }
      if (event.data?.type !== EXTENSION_IMPORT_MESSAGE_TYPE) return;

      if (!listeningRef.current) {
        postExtensionImportAck(
          false,
          "Marketplace Goblin is not listening for extension import."
        );
        return;
      }

      scheduleListenTimeout();

      const { batch, error } = validateExtensionImportMessage(event.data);
      if (error || !batch) {
        postExtensionImportAck(false, error ?? "Invalid extension batch.");
        setListenNotice(error ?? "Rejected malformed extension batch.");
        return;
      }

      postExtensionImportAck(true);
      if (isEbayCapturePlatform(batch.platform)) {
        recordEbayCaptureReceived();
      }
      previewJsonBatch(batch, "Extension batch", "extension");
      setListenNotice(
        `Received ${batch.comps.length} comp${batch.comps.length !== 1 ? "s" : ""} from extension — review and confirm import.`
      );
    }

    window.addEventListener("message", handleExtensionMessage);
    return () => window.removeEventListener("message", handleExtensionMessage);
  }, [previewJsonBatch, scheduleListenTimeout]);

  useEffect(() => () => clearListenTimeout(), [clearListenTimeout]);

  function handleParse() {
    const trimmed = pasteText.trim();
    if (!trimmed) return;

    if (tryParseCompCaptureBatch(trimmed)) {
      previewJsonImport(trimmed);
      return;
    }

    const parsed = parseCompTextBatch(pasteText);
    setJsonImport(null);
    setDrafts(parsed);
    setParseNotice(
      parsed.length > 0
        ? `Parsed ${parsed.length} comp${parsed.length !== 1 ? "s" : ""} — review before import.`
        : "No comps found. Separate multiple listings with a blank line and include a price, or paste a CompCaptureBatch JSON envelope."
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setPasteText(text);
      if (tryParseCompCaptureBatch(text)) {
        previewJsonImport(text);
      } else {
        setParseNotice("Uploaded file is not a valid CompCaptureBatch JSON envelope.");
        setJsonImport(null);
        setDrafts([]);
      }
    };
    reader.readAsText(file);
  }

  function updateDraft(
    draftId: string,
    patch: Partial<ParsedCompDraft>
  ) {
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.draftId === draftId ? { ...draft, ...patch } : draft
      )
    );
  }

  function removeDraft(draftId: string) {
    setDrafts((prev) => prev.filter((draft) => draft.draftId !== draftId));
  }

  function handleImport() {
    if (jsonImport && jsonImport.comps.length > 0) {
      const pending = pendingCompImportRef.current;
      recordCompImport(jsonImport.comps.length, pending?.channel ?? "json");
      if (
        pending?.channel === "extension" &&
        isEbayCapturePlatform(pending.platform)
      ) {
        recordEbayCaptureImported();
      }
      onImport(jsonImport.comps);
      reset();
      return;
    }

    const valid = drafts.filter(isValidCompDraft);
    if (valid.length === 0) return;

    recordCompImport(valid.length, "paste");
    onImport(
      valid.map((draft) =>
        parsedCompDraftToComparable(draft, generateCompId())
      )
    );
    reset();
  }

  const importableCount = jsonImport
    ? jsonImport.comps.length
    : drafts.filter(isValidCompDraft).length;

  return (
    <div className="space-y-3">
      {listening && (
        <div
          className="space-y-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
              </span>
              Listening for extension import
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
          <p className="text-xs text-emerald-200/80">
            Capture comps in the extension, then click Send to Goblin. Listening
            stops after 2 minutes of inactivity or when you cancel.
          </p>
          {listenNotice && (
            <p className="text-xs text-emerald-100/90">{listenNotice}</p>
          )}
        </div>
      )}

      {!open ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setOpen(true)}
          >
            <ClipboardPaste className="size-4" aria-hidden />
            Paste Comp Text / JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full",
              listening && "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            )}
            onClick={() => (listening ? stopListening("Extension listen cancelled.") : startListening())}
            aria-pressed={listening}
          >
            <Radio className="size-4" aria-hidden />
            {listening ? "Stop listening" : "Listen for extension import"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Paste Comp Text / JSON</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={reset}
              aria-label="Close paste comp text"
            >
              <X className="size-3.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste plain comp text, a CompCaptureBatch JSON envelope, or upload a
            `.json` file. Separate multiple plain-text comps with a blank line.
            Or use Listen for extension import for direct Send to Goblin.
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "w-full",
              listening && "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            )}
            onClick={() =>
              listening ? stopListening("Extension listen cancelled.") : startListening()
            }
            aria-pressed={listening}
          >
            <Radio className="size-3.5" aria-hidden />
            {listening ? "Stop listening for extension" : "Listen for extension import"}
          </Button>

          <div className="space-y-2">
            <Label htmlFor="paste-comp-text">Comp text or JSON</Label>
            <Textarea
              id="paste-comp-text"
              rows={6}
              placeholder={`Plain text example:\nMakita drill kit\nSold $45\nGood condition\n\nJSON example:\n{\n  "schemaVersion": "1.0",\n  "source": "json",\n  "comps": [{ "title": "Milwaukee M18", "price": 89.99, "platform": "eBay", "listingType": "sold" }]\n}`}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="min-h-[8rem] font-mono text-sm"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleParse}
              disabled={!pasteText.trim()}
            >
              Preview comps
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileJson className="size-3.5" aria-hidden />
              Upload JSON file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {parseNotice && (
            <p
              className={cn(
                "text-xs",
                importableCount > 0 ? "text-emerald-400" : "text-amber-400"
              )}
            >
              {parseNotice}
            </p>
          )}

          {jsonImport && (
            <JsonImportPreview
              result={jsonImport}
              onImport={handleImport}
            />
          )}

          {drafts.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                Preview — edit before import
              </p>
              {drafts.map((draft) => (
                <CompDraftEditor
                  key={draft.draftId}
                  draft={draft}
                  onChange={(patch) => updateDraft(draft.draftId, patch)}
                  onRemove={() => removeDraft(draft.draftId)}
                />
              ))}

              <Button
                type="button"
                className="w-full bg-violet-600 text-white hover:bg-violet-500"
                onClick={handleImport}
                disabled={importableCount === 0}
              >
                <Plus className="size-4" aria-hidden />
                Import {importableCount} comp{importableCount !== 1 ? "s" : ""}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function JsonImportPreview({
  result,
  onImport,
}: {
  result: NormalizeCapturedCompsResult;
  onImport: () => void;
}) {
  const { comps, report } = result;

  return (
    <div className="space-y-3 rounded-lg border border-border/50 bg-background/50 p-3">
      <div className="flex flex-wrap gap-2 text-[10px]">
        <Badge variant="outline">{report.importedCount} to import</Badge>
        {report.skippedCount > 0 && (
          <Badge variant="outline">{report.skippedCount} skipped</Badge>
        )}
        {report.duplicateCount > 0 && (
          <Badge variant="outline">{report.duplicateCount} duplicates</Badge>
        )}
      </div>

      {report.warnings.length > 0 && (
        <ul className="space-y-1 text-xs text-amber-300">
          {report.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      {comps.length > 0 && (
        <ul className="space-y-2">
          {comps.map((comp) => (
            <li
              key={comp.id}
              className="rounded-lg bg-background/60 p-2.5 text-xs"
            >
              <p className="font-medium">{comp.title}</p>
              <p className="text-muted-foreground">
                {comp.platform} · {comp.listingType} · ${comp.price}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        className="w-full bg-violet-600 text-white hover:bg-violet-500"
        onClick={onImport}
        disabled={comps.length === 0}
      >
        <Plus className="size-4" aria-hidden />
        Import {comps.length} comp{comps.length !== 1 ? "s" : ""}
      </Button>
    </div>
  );
}

function CompDraftEditor({
  draft,
  onChange,
  onRemove,
}: {
  draft: ParsedCompDraft;
  onChange: (patch: Partial<ParsedCompDraft>) => void;
  onRemove: () => void;
}) {
  const valid = isValidCompDraft(draft);

  return (
    <div className="space-y-3 rounded-lg border border-border/50 bg-background/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          <ConfidencePill label="Title" level={draft.confidence.title} />
          <ConfidencePill label="Price" level={draft.confidence.price} />
          <ConfidencePill
            label="Status"
            level={draft.confidence.listingType}
          />
          <Badge
            variant="outline"
            className={cn("text-[10px]", listingTypeStyles[draft.listingType])}
          >
            {draft.listingType}
          </Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remove preview comp"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Title</Label>
        <Input
          value={draft.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs">Price ($)</Label>
          <Input
            type="number"
            min={0}
            value={draft.price || ""}
            onChange={(e) =>
              onChange({ price: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Platform</Label>
          <Select
            value={draft.platform}
            onValueChange={(value) => {
              if (value) onChange({ platform: value });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMP_PLATFORMS.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs">Condition</Label>
          <Select
            value={draft.condition}
            onValueChange={(value) => {
              if (value) {
                onChange({ condition: value as ParsedCompDraft["condition"] });
              }
            }}
          >
            <SelectTrigger className="w-full">
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
        <div className="space-y-2">
          <Label className="text-xs">Sold vs listed</Label>
          <ListingTypeToggle
            value={draft.listingType}
            onChange={(listingType) => onChange({ listingType })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Notes</Label>
        <Textarea
          rows={2}
          value={draft.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </div>

      {!valid && (
        <p className="text-xs text-rose-400">
          Needs a title and price above $0 to import.
        </p>
      )}
    </div>
  );
}

function ConfidencePill({
  label,
  level,
}: {
  label: string;
  level: FieldConfidence;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px]", confidenceStyles[level])}
    >
      {label}: {level}
    </Badge>
  );
}

function ListingTypeToggle({
  value,
  onChange,
}: {
  value: CompListingType;
  onChange: (type: CompListingType) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border/60 bg-background/60 p-0.5">
      {(["sold", "listed"] as const).map((type) => (
        <button
          key={type}
          type="button"
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors",
            value === type
              ? type === "sold"
                ? "bg-emerald-600 text-white"
                : "bg-amber-600 text-white"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onChange(type)}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
