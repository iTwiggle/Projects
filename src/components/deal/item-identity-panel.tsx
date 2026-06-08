"use client";

import { AlertTriangle, Fingerprint } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ItemIdentity } from "@/lib/types/item-identity";
import { cn } from "@/lib/utils";

interface ItemIdentityPanelProps {
  identity: ItemIdentity;
}

const confidenceStyles = {
  low: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  high: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const confidenceLabels = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
};

export function ItemIdentityPanel({ identity }: ItemIdentityPanelProps) {
  const hasIdentity =
    identity.brand || identity.model || identity.productFamily;
  const evidenceCount = identity.evidence.matchCount;

  return (
    <Card className="border-border/50 bg-card/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Fingerprint className="size-4 text-cyan-400" aria-hidden />
            Item Identity
          </CardTitle>
          <Badge
            variant="outline"
            className={cn("shrink-0 text-[10px]", confidenceStyles[identity.confidence])}
          >
            {confidenceLabels[identity.confidence]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Inferred from item details, listing text, OCR, comps, and URL hints
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {identity.warnings.length > 0 && (
          <div className="space-y-1.5">
            {identity.warnings.map((warning) => (
              <p
                key={warning}
                className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-200"
              >
                <AlertTriangle
                  className="mt-0.5 size-3.5 shrink-0 text-amber-400"
                  aria-hidden
                />
                {warning}
              </p>
            ))}
          </div>
        )}

        {hasIdentity ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <IdentityField
                label="Detected brand"
                value={identity.brand ?? "—"}
              />
              <IdentityField
                label="Detected model"
                value={identity.model ?? identity.productFamily ?? "—"}
              />
            </div>

            {(identity.productFamily || identity.variant) && (
              <div className="grid grid-cols-2 gap-2">
                {identity.productFamily && (
                  <IdentityField
                    label="Product family"
                    value={identity.productFamily}
                  />
                )}
                {identity.variant && (
                  <IdentityField label="Variant" value={identity.variant} />
                )}
              </div>
            )}

            <p className="rounded-lg bg-cyan-500/5 p-3 text-xs leading-relaxed text-muted-foreground">
              {identity.displayLabel}
            </p>

            {identity.sources.length > 0 && (
              <div className="rounded-lg bg-background/60 p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Evidence sources
                </p>
                <p className="mt-1 text-xs text-foreground">
                  {identity.sources.join(" · ")}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {evidenceCount} supporting signal{evidenceCount === 1 ? "" : "s"}
                  {identity.hasConflict &&
                    ` · ${identity.evidence.conflictCount} conflict${identity.evidence.conflictCount === 1 ? "" : "s"}`}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="rounded-lg bg-background/60 p-3 text-xs text-muted-foreground">
            No brand or model detected — add item name, listing details, or
            comp titles to improve identity.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function IdentityField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/60 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="truncate text-sm font-medium">{value}</p>
    </div>
  );
}
