"use client";

import { ExternalLink, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ListingLinkInfo } from "@/lib/types/listing-url";
import { cn } from "@/lib/utils";

const platformBadgeStyles = {
  facebook_marketplace: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  craigslist: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  offerup: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  ebay: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  unknown: "bg-muted text-muted-foreground border-border/60",
} as const;

interface ListingLinkPanelProps {
  listing: ListingLinkInfo;
}

export function ListingLinkPanel({ listing }: ListingLinkPanelProps) {
  if (!listing.hasLink || !listing.url) return null;

  return (
    <Card className="border-border/50 bg-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="size-4 text-emerald-400" aria-hidden />
          Listing Link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              platformBadgeStyles[listing.platform]
            )}
          >
            {listing.platformLabel}
          </Badge>
          {listing.hostname && (
            <span className="text-[10px] text-muted-foreground">
              {listing.hostname}
            </span>
          )}
        </div>

        <p className="break-all text-xs text-muted-foreground">{listing.url}</p>

        <Button
          className="w-full bg-emerald-600 text-white hover:bg-emerald-500 sm:w-auto"
          render={
            <a href={listing.url} target="_blank" rel="noopener noreferrer" />
          }
        >
          <ExternalLink className="size-4" aria-hidden />
          Open Listing
        </Button>
      </CardContent>
    </Card>
  );
}
