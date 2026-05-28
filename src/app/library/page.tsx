"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Search, Tag } from "lucide-react";
import { ForgeBackground } from "@/components/layout/forge-background";
import { Header } from "@/components/layout/header";
import { ConceptCard } from "@/components/forge/concept-card";
import { GlassCard } from "@/components/forge/glass-card";
import { Input } from "@/components/ui/input";
import { loadState } from "@/lib/storage";
import type { Concept } from "@/types/concept";

export default function LibraryPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [filter, setFilter] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      queueMicrotask(() => setConcepts(saved.concepts));
    }
    queueMicrotask(() => setHydrated(true));
  }, []);

  const filtered = concepts.filter((c) => {
    if (showFavoritesOnly && !c.isFavorite) return false;
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.pitch.toLowerCase().includes(q) ||
      c.tags.some((t) => t.includes(q))
    );
  });

  const favorites = concepts.filter((c) => c.isFavorite);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06060b] text-zinc-500">
        Loading vault…
      </div>
    );
  }

  return (
    <>
      <ForgeBackground />
      <Header savedCount={favorites.length} />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-cyan-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Forge
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-white">Concept Vault</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Saved iterations, favorites, and mutation history — persisted locally.
          </p>
        </motion.div>

        <GlassCard className="mt-6 p-4" glow="violet">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search concepts, tags…"
                className="border-white/10 bg-black/20 pl-9"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
                showFavoritesOnly
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                  : "border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              <Heart className="h-4 w-4" />
              Favorites only
            </button>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-zinc-500">
            <span>{concepts.length} total concepts</span>
            <span>{favorites.length} favorites</span>
            <span>
              {concepts.filter((c) => c.parentId).length} mutations
            </span>
          </div>
        </GlassCard>

        {filtered.length === 0 ? (
          <div className="mt-12 text-center text-zinc-600">
            <Tag className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p>No concepts in vault yet.</p>
            <Link href="/" className="mt-2 inline-block text-cyan-400 hover:underline">
              Return to the forge
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filtered.map((concept, i) => (
              <motion.div
                key={concept.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ConceptCard concept={concept} compact={false} />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
