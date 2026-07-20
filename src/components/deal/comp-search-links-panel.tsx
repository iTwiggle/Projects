"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CompSearchQuery } from "@/lib/types/comp-search";
import { cn } from "@/lib/utils";

interface CompSearchLinksPanelProps {
  compSearch: CompSearchQuery;
}

const sourceBadgeStyles = {
  identity: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  itemName: "bg-muted text-muted-foreground border-border/60",
} as const;

export function CompSearchLinksPanel({ compSearch }: CompSearchLinksPanelProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopyQuery() {
    try {
      await navigator.clipboard.writeText(compSearch.query);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Search className="size-3.5 text-sky-400" aria-hidden />
            <p className="text-xs font-medium text-sky-300">Comp search links</p>
          </div>
          <p className="text-[10px] text-muted-foreground">
            One-tap searches to find sold and active listings
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 text-[10px]", sourceBadgeStyles[compSearch.source])}
        >
          {compSearch.sourceLabel}
        </Badge>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-background/60 p-2.5">
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-foreground">
          {compSearch.query}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="h-7 shrink-0 gap-1 text-xs"
          onClick={handleCopyQuery}
          aria-label="Copy search query"
        >
          {copied ? (
            <Check className="size-3 text-emerald-400" aria-hidden />
          ) : (
            <Copy className="size-3" aria-hidden />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {compSearch.links.map((link) => (
          <Button
            key={link.platform}
            type="button"
            variant="outline"
            size="sm"
            className="h-auto min-h-9 justify-between gap-2 px-3 py-2 text-left text-xs"
            render={
              <a href={link.url} target="_blank" rel="noopener noreferrer" />
            }
          >
            <span className="truncate font-medium">{link.label}</span>
            <ExternalLink
              className="size-3 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </Button>
        ))}
      </div>
    </div>
  );
}
