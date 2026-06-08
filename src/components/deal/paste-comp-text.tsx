"use client";

import { useState } from "react";
import { ClipboardPaste, Plus, X } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface PasteCompTextProps {
  onImport: (comps: ComparableSale[]) => void;
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

export function PasteCompText({ onImport }: PasteCompTextProps) {
  const [open, setOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [drafts, setDrafts] = useState<ParsedCompDraft[]>([]);
  const [parseNotice, setParseNotice] = useState<string | null>(null);

  function reset() {
    setPasteText("");
    setDrafts([]);
    setParseNotice(null);
    setOpen(false);
  }

  function handleParse() {
    const parsed = parseCompTextBatch(pasteText);
    setDrafts(parsed);
    setParseNotice(
      parsed.length > 0
        ? `Parsed ${parsed.length} comp${parsed.length !== 1 ? "s" : ""} — review before import.`
        : "No comps found. Separate multiple listings with a blank line and include a price."
    );
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
    const valid = drafts.filter(isValidCompDraft);
    if (valid.length === 0) return;

    onImport(
      valid.map((draft) =>
        parsedCompDraftToComparable(draft, generateCompId())
      )
    );
    reset();
  }

  const importableCount = drafts.filter(isValidCompDraft).length;

  return (
    <div className="space-y-3">
      {!open ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setOpen(true)}
        >
          <ClipboardPaste className="size-4" aria-hidden />
          Paste Comp Text
        </Button>
      ) : (
        <div className="space-y-3 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Paste Comp Text</p>
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
            Paste eBay sold results, Marketplace/Craigslist/OfferUp listings, or
            auction text. Separate multiple comps with a blank line.
          </p>

          <div className="space-y-2">
            <Label htmlFor="paste-comp-text">Comp text</Label>
            <Textarea
              id="paste-comp-text"
              rows={6}
              placeholder={`eBay sold example:\nMakita drill kit\nSold $45\nGood condition\n\neBay sold example 2:\nVintage camera\n$120 sold on eBay`}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="min-h-[8rem] text-sm"
            />
          </div>

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

          {parseNotice && (
            <p
              className={cn(
                "text-xs",
                drafts.length > 0 ? "text-emerald-400" : "text-amber-400"
              )}
            >
              {parseNotice}
            </p>
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
