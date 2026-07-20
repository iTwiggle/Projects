"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/layout/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { UsageDashboard } from "@/components/dashboard/usage-dashboard";
import { DealAnalyzer } from "@/components/deal/deal-analyzer";
import { DealDetailDialog } from "@/components/deal/deal-detail-dialog";
import { DealList } from "@/components/deal/deal-list";
import { calculateDashboardStats } from "@/lib/storage/deals";
import { useDeals } from "@/hooks/use-deals";
import type { SavedDeal } from "@/lib/types/deal";

export function HomePage() {
  const { deals, isLoaded, addDeal, editDeal, setDealComps, removeDeal } =
    useDeals();
  const [editingDeal, setEditingDeal] = useState<SavedDeal | null>(null);
  const [viewingDealId, setViewingDealId] = useState<string | null>(null);

  const viewingDeal = useMemo(
    () => deals.find((deal) => deal.id === viewingDealId) ?? null,
    [deals, viewingDealId]
  );

  const stats = calculateDashboardStats(deals);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Rummaging through the cave...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-background to-background" />
      <Header />
      <main className="relative mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Treasure Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Your flip hunting stats at a glance
            </p>
          </div>
          <StatsCards stats={stats} />
        </section>

        <UsageDashboard />

        <DealAnalyzer
          onSave={addDeal}
          onEdit={editDeal}
          editingDeal={editingDeal}
          onClearEdit={() => setEditingDeal(null)}
        />

        <DealList
          deals={deals}
          onView={(deal) => setViewingDealId(deal.id)}
          onEdit={setEditingDeal}
          onDelete={removeDeal}
        />
      </main>

      <DealDetailDialog
        deal={viewingDeal}
        onClose={() => setViewingDealId(null)}
        onCompsChange={setDealComps}
      />
    </div>
  );
}
