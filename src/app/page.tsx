"use client";

import Link from "next/link";
import { ArrowUpRight, Settings2, WalletCards } from "lucide-react";

import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
            <WalletCards className="h-3.5 w-3.5" />
            Local-first poker tracking
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Bankroll Sidekick
            </h1>
            <p className="max-w-2xl text-sm text-slate-400 sm:text-base">
              Track sessions, protect your bankroll, and spot progress without
              adding friction or cloud dependencies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="secondary">
            <Link href="/settings">
              Settings
              <Settings2 className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild>
            <Link href="#log-session">
              Quick add session
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <DashboardView />
    </main>
  );
}
