"use client";

import { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  description?: string;
  icon: LucideIcon;
  tone?: "neutral" | "positive" | "negative" | "warning";
};

const toneMap: Record<NonNullable<StatCardProps["tone"]>, string> = {
  neutral: "text-slate-100",
  positive: "text-emerald-300",
  negative: "text-rose-300",
  warning: "text-amber-300",
};

export function StatCard({
  title,
  value,
  subtitle,
  description,
  icon: Icon,
  tone = "neutral",
}: StatCardProps) {
  const helperText = subtitle ?? description;
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{title}</p>
          <CardTitle className={cn("text-3xl font-semibold tracking-tight", toneMap[tone])}>
            {value}
          </CardTitle>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-slate-300">
          <Icon className="size-5" />
        </div>
      </CardHeader>
      {helperText ? (
        <CardContent>
          <p className="text-sm text-slate-400">{helperText}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}
