"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRightLeft,
  Building2,
  Dna,
  Flame,
  Loader2,
  Minimize2,
  Skull,
  TrendingUp,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Concept, MutationType } from "@/types/concept";
import { GlassCard } from "./glass-card";

interface MutationPanelProps {
  activeConcept: Concept | null;
  concepts: Concept[];
  onMutate: (type: MutationType) => void;
  onCombine: (idA: string, idB: string) => void;
  isMutating: boolean;
}

const MUTATIONS: {
  type: MutationType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { type: "cursed", label: "More Cursed", icon: Skull, color: "hover:border-rose-500/40 hover:text-rose-300" },
  { type: "profitable", label: "More Profitable", icon: TrendingUp, color: "hover:border-emerald-500/40 hover:text-emerald-300" },
  { type: "simpler", label: "Simpler", icon: Minimize2, color: "hover:border-cyan-500/40 hover:text-cyan-300" },
  { type: "scalable", label: "More Scalable", icon: Zap, color: "hover:border-violet-500/40 hover:text-violet-300" },
  { type: "b2b", label: "Pivot B2B", icon: Building2, color: "hover:border-blue-500/40 hover:text-blue-300" },
  { type: "creators", label: "Pivot Creators", icon: Users, color: "hover:border-pink-500/40 hover:text-pink-300" },
  { type: "low-maintenance", label: "Reduce Ops", icon: Wrench, color: "hover:border-amber-500/40 hover:text-amber-300" },
  { type: "evolve", label: "Evolve Market", icon: Dna, color: "hover:border-violet-500/40 hover:text-violet-300" },
  { type: "remix", label: "Remix", icon: ArrowRightLeft, color: "hover:border-cyan-500/40 hover:text-cyan-300" },
];

export function MutationPanel({
  activeConcept,
  concepts,
  onMutate,
  onCombine,
  isMutating,
}: MutationPanelProps) {
  const [combineTarget, setCombineTarget] = useState("");

  return (
    <GlassCard className="p-4 sm:p-5" glow="violet">
      <div className="mb-4 flex items-center gap-2">
        <Dna className="h-4 w-4 text-violet-400" />
        <div>
          <h2 className="text-sm font-semibold text-white">Mutation Engine</h2>
          <p className="text-xs text-zinc-500">Evolutionary concept engineering</p>
        </div>
      </div>

      {!activeConcept ? (
        <p className="rounded-lg border border-dashed border-white/10 p-4 text-center text-sm text-zinc-500">
          Select a concept to begin mutations
        </p>
      ) : (
        <>
          <div className="mb-4 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
            <p className="text-[10px] uppercase tracking-wider text-violet-400/80">
              Active strand
            </p>
            <p className="truncate text-sm font-medium text-white">
              {activeConcept.name}
            </p>
          </div>

          {isMutating && (
            <div className="mb-3 flex items-center justify-center gap-2 text-sm text-violet-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Recombining DNA…
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MUTATIONS.map((m, i) => (
              <motion.div
                key={m.type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isMutating}
                  onClick={() => onMutate(m.type)}
                  className={`h-auto w-full flex-col gap-1 border-white/8 bg-white/[0.02] py-2.5 text-xs ${m.color}`}
                >
                  <m.icon className="h-3.5 w-3.5" />
                  {m.label}
                </Button>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 border-t border-white/5 pt-4">
            <div className="mb-2 flex items-center gap-2">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-zinc-400">
                Fusion Reactor — combine two concepts
              </span>
            </div>
            <Select
              value={combineTarget}
              onValueChange={(v) => setCombineTarget(v ?? "")}
            >
              <SelectTrigger className="mb-2 border-white/10 bg-black/20">
                <SelectValue placeholder="Select fusion partner…" />
              </SelectTrigger>
              <SelectContent>
                {concepts
                  .filter((c) => c.id !== activeConcept.id)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              disabled={!combineTarget || isMutating}
              onClick={() => onCombine(activeConcept.id, combineTarget)}
              className="w-full gap-2 bg-amber-600/80 hover:bg-amber-500"
              size="sm"
            >
              <Flame className="h-3.5 w-3.5" />
              Fuse Concepts
            </Button>
          </div>
        </>
      )}
    </GlassCard>
  );
}
