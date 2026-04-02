"use client";

import { Filter } from "lucide-react";

import type { GameType, RangeFilter } from "@/lib/types";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS: RangeFilter[] = ["7d", "30d", "all"];
const GAME_OPTIONS: Array<GameType | "all"> = ["all", "Spins", "MTT", "Cash", "Other"];

type FiltersProps = {
  range: RangeFilter;
  setRange: (value: RangeFilter) => void;
  gameType: GameType | "all";
  setGameType: (value: GameType | "all") => void;
  tag: string | "all";
  setTag: (value: string | "all") => void;
  tagOptions: string[];
};

export function Filters({
  range,
  setRange,
  gameType,
  setGameType,
  tag,
  setTag,
  tagOptions,
}: FiltersProps) {
  const tags = ["all", ...tagOptions] as const;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
        <Filter className="h-4 w-4 text-cyan-300" />
        Quick filters
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <FilterGroup label="Range">
          {RANGE_OPTIONS.map((value) => (
            <Chip
              key={value}
              active={range === value}
              onClick={() => setRange(value)}
            >
              {value === "7d" ? "Last 7 days" : value === "30d" ? "Last 30 days" : "All time"}
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup label="Game type">
          {GAME_OPTIONS.map((value) => (
            <Chip
              key={value}
              active={gameType === value}
              onClick={() => setGameType(value)}
            >
              {value === "all" ? "All games" : value}
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup label="Tag">
          {tags.map((value) => (
            <Chip key={value} active={tag === value} onClick={() => setTag(value)}>
              {value === "all" ? "All tags" : value}
            </Chip>
          ))}
        </FilterGroup>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.24em] text-white/45">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition",
        active
          ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-100"
          : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}
