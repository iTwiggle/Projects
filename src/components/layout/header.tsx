import { Gem } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border/60 bg-card/40 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
          <Gem className="size-5 text-emerald-400" aria-hidden />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight sm:text-xl">
            Marketplace Goblin
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Hunt treasures. Skip traps. Flip with confidence.
          </p>
        </div>
      </div>
    </header>
  );
}
