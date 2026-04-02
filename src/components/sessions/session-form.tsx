"use client";

import { useMemo, useState } from "react";

import {
  GAME_TYPES,
  SESSION_TAG_SUGGESTIONS,
} from "@/lib/seed-data";
import type {
  SessionInput,
  SessionRecord,
} from "@/lib/types";
import { formatCurrency, formatNumber, sanitizeCurrencyInput } from "@/lib/bankroll";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type SessionFormProps = {
  currency: string;
  initialSession?: SessionRecord | null;
  onCancel?: () => void;
  onSubmit: (input: SessionInput) => void;
};

type FormState = {
  date: string;
  gameType: SessionRecord["gameType"];
  stake: string;
  buyIn: string;
  entries: string;
  totalInvested: string;
  cashout: string;
  durationMinutes: string;
  notes: string;
  tags: string;
};

const getInitialState = (session?: SessionRecord | null): FormState => ({
  date: session?.date ?? new Date().toISOString().slice(0, 10),
  gameType: session?.gameType ?? "Spins",
  stake: session?.stake ?? "",
  buyIn: session ? String(session.buyIn) : "",
  entries: session ? String(session.entries) : "1",
  totalInvested: session ? String(session.totalInvested) : "",
  cashout: session ? String(session.cashout) : "",
  durationMinutes: session?.durationMinutes ? String(session.durationMinutes) : "",
  notes: session?.notes ?? "",
  tags: session?.tags.join(", ") ?? "",
});

export function SessionForm({ currency, initialSession, onCancel, onSubmit }: SessionFormProps) {
  const [form, setForm] = useState<FormState>(() => getInitialState(initialSession));
  const [error, setError] = useState<string | null>(null);
  const editingKey = initialSession?.id ?? "new";

  const parsedEntries = Math.max(Number(form.entries || 1), 1);
  const buyInNumber = Number(form.buyIn || 0);

  const suggestedInvested = useMemo(() => {
    if (!buyInNumber || !parsedEntries) return 0;
    return Number((buyInNumber * parsedEntries).toFixed(2));
  }, [buyInNumber, parsedEntries]);

  const investedValue = Number(form.totalInvested || 0);
  const cashoutValue = Number(form.cashout || 0);
  const profit = Number((cashoutValue - investedValue).toFixed(2));

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const buyIn = sanitizeCurrencyInput(form.buyIn);
    const entries = Math.max(Math.floor(Number(form.entries || 1)), 1);
    const totalInvested = sanitizeCurrencyInput(form.totalInvested);
    const cashout = sanitizeCurrencyInput(form.cashout);
    const durationMinutes = form.durationMinutes ? Math.max(Math.floor(Number(form.durationMinutes)), 0) : undefined;

    if (!form.date) {
      setError("Session date is required.");
      return;
    }

    if (!form.stake.trim()) {
      setError("Stake or buy-in label is required.");
      return;
    }

    if (buyIn <= 0) {
      setError("Buy-in must be greater than zero.");
      return;
    }

    if (totalInvested < 0 || cashout < 0) {
      setError("Invested and return values cannot be negative.");
      return;
    }

    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    onSubmit({
      date: form.date,
      gameType: form.gameType,
      stake: form.stake.trim(),
      buyIn,
      entries,
      totalInvested,
      cashout,
      notes: form.notes.trim(),
      durationMinutes,
      tags,
    });

    if (!initialSession) {
      setForm(getInitialState(null));
    }
  };

  return (
    <Card key={editingKey} className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle>{initialSession ? "Edit session" : "Quick-add session"}</CardTitle>
        <CardDescription>
          Low-friction entry with automatic profit calculation and optional notes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(event) => handleChange("date", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gameType">Game type</Label>
              <Select
                id="gameType"
                value={form.gameType}
                onChange={(event) =>
                  handleChange(
                    "gameType",
                    event.target.value as SessionRecord["gameType"],
                  )
                }
              >
                {GAME_TYPES.map((gameType) => (
                  <option key={gameType} value={gameType}>
                    {gameType}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stake">Stake / label</Label>
              <Input
                id="stake"
                placeholder="$10 Spin or 1/3 NLH"
                value={form.stake}
                onChange={(event) => handleChange("stake", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={form.durationMinutes}
                onChange={(event) => handleChange("durationMinutes", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="buyIn">Buy-in</Label>
              <Input
                id="buyIn"
                type="number"
                min="0"
                step="0.01"
                value={form.buyIn}
                onChange={(event) => handleChange("buyIn", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entries">Entries / rebuys</Label>
              <Input
                id="entries"
                type="number"
                min="1"
                step="1"
                value={form.entries}
                onChange={(event) => handleChange("entries", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invested">Total invested</Label>
              <Input
                id="invested"
                type="number"
                min="0"
                step="0.01"
                value={form.totalInvested}
                onChange={(event) => handleChange("totalInvested", event.target.value)}
              />
              <p className="text-xs text-slate-500">
                Suggested from buy-in x entries: {formatCurrency(suggestedInvested, currency)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashout">Cashout / return</Label>
              <Input
                id="cashout"
                type="number"
                min="0"
                step="0.01"
                value={form.cashout}
                onChange={(event) => handleChange("cashout", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_320px]">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Short notes about mindset, table quality, mistakes, or discipline."
                value={form.notes}
                onChange={(event) => handleChange("notes", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="tilt, good quit, shot take"
                value={form.tags}
                onChange={(event) => handleChange("tags", event.target.value)}
              />
              <div className="flex flex-wrap gap-2 pt-2">
                {SESSION_TAG_SUGGESTIONS.map((tag) => {
                  const activeTags = form.tags
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean);
                  const isActive = activeTags.includes(tag);

                  return (
                    <button
                      key={tag}
                      type="button"
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        isActive
                          ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200"
                          : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:text-white",
                      )}
                      onClick={() => {
                        const nextTags = isActive
                          ? activeTags.filter((value) => value !== tag)
                          : [...activeTags, tag];
                        handleChange("tags", nextTags.join(", "));
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Calculated result</p>
                <p
                  className={cn(
                    "mt-1 text-2xl font-semibold",
                    profit >= 0 ? "text-emerald-300" : "text-rose-300",
                  )}
                >
                  {formatCurrency(profit, currency)}
                </p>
              </div>
              <div className="text-right text-sm text-slate-400">
                <p>Invested: {formatCurrency(investedValue, currency)}</p>
                <p>Cashout: {formatCurrency(cashoutValue, currency)}</p>
                <p>Entries: {formatNumber(parsedEntries)}</p>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit">{initialSession ? "Save session" : "Add session"}</Button>
            {initialSession && onCancel ? (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
