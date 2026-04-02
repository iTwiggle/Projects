"use client";

import { Pencil, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateLabel } from "@/lib/bankroll";
import type { GameType, SessionRecord } from "@/lib/types";

type SessionHistoryProps = {
  sessions: SessionRecord[];
  currency: string;
  onEdit: (session: SessionRecord) => void;
  onDelete: (id: string) => void;
};

const gameTypeStyles: Record<GameType, string> = {
  Spins: "bg-cyan-500/10 text-cyan-300",
  MTT: "bg-violet-500/10 text-violet-300",
  Cash: "bg-emerald-500/10 text-emerald-300",
  Other: "bg-slate-500/10 text-slate-300",
};

function formatDuration(minutes?: number) {
  if (!minutes) return "n/a";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins}m`;
  if (!mins) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function SessionHistory({
  sessions,
  currency,
  onEdit,
  onDelete,
}: SessionHistoryProps) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg text-white">Session history</CardTitle>
          <p className="text-sm text-slate-400">
            Edit or remove past sessions without breaking bankroll math.
          </p>
        </div>
        <div className="text-sm text-slate-400">{sessions.length} sessions</div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            description="Add your first session to start building your bankroll timeline."
          />
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border border-white/8 bg-slate-950/60 p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${gameTypeStyles[session.gameType]}`}
                      >
                        {session.gameType}
                      </span>
                      {session.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div>
                      <div className="text-sm text-slate-400">
                        {formatDateLabel(session.date)} · {session.stake} ·{" "}
                        {formatDuration(session.durationMinutes)}
                      </div>
                      <div
                        className={`mt-1 text-base font-semibold ${
                          session.profitLoss >= 0 ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {formatCurrency(session.profitLoss, currency)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-300 sm:grid-cols-4">
                      <Metric label="Buy-in" value={formatCurrency(session.buyIn, currency)} />
                      <Metric
                        label="Invested"
                        value={formatCurrency(session.totalInvested, currency)}
                      />
                      <Metric label="Return" value={formatCurrency(session.cashout, currency)} />
                      <Metric label="Entries" value={String(session.entries)} />
                    </div>

                    {session.notes ? (
                      <p className="text-sm leading-6 text-slate-400">{session.notes}</p>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => onEdit(session)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <ConfirmDialog
                      title="Delete session?"
                      description="This removes the session and immediately updates bankroll, analytics, and rule state."
                      confirmLabel="Delete session"
                      destructive
                      onConfirm={() => onDelete(session.id)}
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-white">{value}</div>
    </div>
  );
}
