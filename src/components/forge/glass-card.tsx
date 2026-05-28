"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "cyan" | "violet" | "amber" | "none";
  hover?: boolean;
}

const glowStyles = {
  cyan: "hover:border-cyan-500/30 hover:shadow-[0_0_40px_rgba(34,211,238,0.08)]",
  violet: "hover:border-violet-500/30 hover:shadow-[0_0_40px_rgba(139,92,246,0.08)]",
  amber: "hover:border-amber-500/30 hover:shadow-[0_0_40px_rgba(251,191,36,0.08)]",
  none: "",
};

export function GlassCard({
  children,
  className,
  glow = "cyan",
  hover = true,
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-md",
        hover && glowStyles[glow],
        className
      )}
    >
      {children}
    </motion.div>
  );
}
