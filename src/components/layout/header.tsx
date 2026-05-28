"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Anvil, BookOpen, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  savedCount?: number;
}

export function Header({ savedCount = 0 }: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b border-white/5 bg-[#06060b]/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_24px_rgba(34,211,238,0.2)]">
            <Anvil className="h-5 w-5 text-cyan-400" />
            <div className="absolute inset-0 rounded-xl bg-cyan-400/5 blur-sm" />
          </div>
          <div>
            <span className="text-lg font-semibold tracking-tight text-white">
              Concept Forge
            </span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Idea Reactor Core
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/library"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Vault</span>
            {savedCount > 0 && (
              <Badge
                variant="secondary"
                className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
              >
                {savedCount}
              </Badge>
            )}
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1.5 sm:flex">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-xs text-violet-300/80">MVP · Local Forge</span>
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
