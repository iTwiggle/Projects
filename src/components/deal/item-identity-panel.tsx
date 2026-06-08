"use client";

import { Fingerprint } from "lucide-react";
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
  low: "Low identity confidence",
  medium: "Medium identity confidence",
  high: "High identity confidence",
};

export function ItemIdentityPanel({ identity }: ItemIdentityPanelProps) {
  const hasIdentity =
    identity.brand || identity.model || identity.productFamily;

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
          From item name, notes, comps, and listing URL hints
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
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
              <p className="text-[10px] text-muted-foreground">
                Sources: {identity.sources.join(", ")}
              </p>
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
