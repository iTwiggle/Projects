import { Atom, BrainCircuit, Sparkle } from "lucide-react";

export function ForgeHeader() {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-br from-zinc-950/90 via-zinc-900/80 to-zinc-950/95 p-5 shadow-[0_0_60px_-35px_rgba(56,189,248,0.95)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),rgba(0,0,0,0))]" />
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs tracking-wide text-cyan-100 uppercase">
          <Sparkle className="h-3.5 w-3.5" />
          AI-Powered App Refinery
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Concept Forge
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-300 sm:text-base">
          Mutate and score software concepts with a startup incubator mindset. Transform vague
          interests into strategically useful product dossiers.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-300">
            <BrainCircuit className="mb-1 h-4 w-4 text-cyan-300" />
            Idea mutation logic drives non-obvious combinations.
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-300">
            <Atom className="mb-1 h-4 w-4 text-fuchsia-300" />
            Weighted scoring highlights feasibility and market opportunity.
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-300">
            <Sparkle className="mb-1 h-4 w-4 text-emerald-300" />
            Local persistence keeps your evolving concept library intact.
          </div>
        </div>
      </div>
    </header>
  );
}
