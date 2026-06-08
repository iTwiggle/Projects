import { ScrollText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DealCard } from "@/components/deal/deal-card";
import type { SavedDeal } from "@/lib/types/deal";

interface DealListProps {
  deals: SavedDeal[];
  onEdit: (deal: SavedDeal) => void;
  onDelete: (id: string) => void;
}

export function DealList({ deals, onEdit, onDelete }: DealListProps) {
  if (deals.length === 0) {
    return (
      <Card className="border-dashed border-border/60 bg-card/40">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <ScrollText className="size-8 text-muted-foreground/50" aria-hidden />
          <p className="text-sm font-medium">No saved deals yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Analyze a listing above and save it to build your treasure log.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Saved Deals</h2>
        <p className="text-sm text-muted-foreground">
          {deals.length} deal{deals.length !== 1 ? "s" : ""} in your cave
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
