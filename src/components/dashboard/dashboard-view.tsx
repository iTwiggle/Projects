"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Landmark,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAppState } from "@/components/shared/app-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { Filters } from "@/components/shared/filters";
import { SectionHeading } from "@/components/shared/section-heading";
import { StatCard } from "@/components/shared/stat-card";
import { SessionForm } from "@/components/sessions/session-form";
import { SessionHistory } from "@/components/sessions/session-history";
import { WithdrawalPanel } from "@/components/dashboard/withdrawal-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  calculateAnalytics,
  calculateSessionProfit,
  computeBankrollSummary,
  formatCurrency,
  formatDateLabel,
  getFilteredSessions,
} from "@/lib/bankroll";
import type { GameType, RangeFilter, SessionRecord, SessionTag } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatTooltipCurrency(value: string | number | undefined, currency: string) {
  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
  return formatCurrency(Number.isFinite(numericValue) ? numericValue : 0, currency);
}

const STATUS_STYLES = {
  "safe to play": "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
  "approaching stop-loss":
    "text-amber-200 border-amber-500/30 bg-amber-500/10",
  "withdrawal available":
    "text-sky-200 border-sky-500/30 bg-sky-500/10",
  "below bankroll floor": "text-rose-200 border-rose-500/30 bg-rose-500/10",
} as const;

const GAME_COLORS = ["#38bdf8", "#14b8a6", "#a78bfa", "#f97316"];

function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

function formatDuration(minutes?: number) {
  if (!minutes) return "n/a";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins}m`;
  if (!mins) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function DashboardView() {
  const { state, addSession, updateSession, deleteSession } = useAppState();
  const [range, setRange] = useState<RangeFilter>("30d");
  const [tag, setTag] = useState<SessionTag | "all">("all");
  const [gameType, setGameType] = useState<GameType | "all">("all");
  const [editingSession, setEditingSession] = useState<SessionRecord | null>(null);

  const filteredSessions = useMemo(
    () =>
      getFilteredSessions(state.sessions, {
        range,
        tag,
        gameType,
      }),
    [gameType, range, state.sessions, tag],
  );

  const bankrollState = useMemo(
    () => computeBankrollSummary(state.settings, state.sessions, state.withdrawals, state.deposits),
    [state.deposits, state.sessions, state.settings, state.withdrawals],
  );

  const filteredAnalytics = useMemo(
    () =>
      calculateAnalytics({
        ...state,
        sessions: filteredSessions,
      }),
    [filteredSessions, state],
  );

  const allTags = useMemo(
    () =>
      Array.from(new Set(state.sessions.flatMap((session) => session.tags))).sort(),
    [state.sessions],
  );

  const chartData = filteredAnalytics.bankrollChart;
  const performanceByType = filteredAnalytics.profitByGameType;
  const withdrawalChart = filteredAnalytics.withdrawalChart;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <Card className="overflow-hidden">
          <CardContent className="relative p-6 md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_30%)]" />
            <div className="relative flex flex-col gap-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                    <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                    Today&apos;s status
                  </div>
                  <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    {formatCurrency(bankrollState.currentBankroll, state.settings.currency)}
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-zinc-400">
                    Current bankroll based on starting roll, deposits, withdrawals,
                    and all session results tracked locally on this device.
                  </p>
                </div>

                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em]",
                    STATUS_STYLES[bankrollState.status],
                  )}
                >
                  {bankrollState.status === "below bankroll floor" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : bankrollState.status === "withdrawal available" ? (
                    <ArrowDownRight className="h-4 w-4" />
                  ) : bankrollState.status === "approaching stop-loss" ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {bankrollState.status}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                    Total P/L
                  </p>
                  <p
                    className={cn(
                      "mt-3 text-2xl font-semibold",
                      bankrollState.totalProfitLoss >= 0
                        ? "text-emerald-300"
                        : "text-rose-300",
                    )}
                  >
                    {formatCurrency(
                      bankrollState.totalProfitLoss,
                      state.settings.currency,
                    )}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                    Secured outside bankroll
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-zinc-100">
                    {formatCurrency(
                      bankrollState.securedOutsideBankroll,
                      state.settings.currency,
                    )}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                    Effective baseline
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-zinc-100">
                    {formatCurrency(
                      bankrollState.effectiveBaseline,
                      state.settings.currency,
                    )}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                    Tier / status
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-zinc-100">
                    {bankrollState.tierLabel}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rule state</CardTitle>
            <CardDescription>
              Live interpretation of your bankroll rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Current call
              </p>
              <p className="mt-2 text-lg font-semibold capitalize text-zinc-100">
                {bankrollState.status}
              </p>
              <p className="mt-2 leading-6 text-zinc-400">
                {bankrollState.statusExplanation}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Stop-loss room
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-100">
                  {formatCurrency(
                    bankrollState.remainingStopLoss,
                    state.settings.currency,
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Suggested withdrawal
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-100">
                  {formatCurrency(
                    bankrollState.suggestedWithdrawal,
                    state.settings.currency,
                  )}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/60 p-4 leading-6 text-zinc-400">
              <p>
                Trigger point:{" "}
                <span className="font-medium text-zinc-200">
                  {formatCurrency(
                    bankrollState.nextWithdrawalTarget,
                    state.settings.currency,
                  )}
                </span>
              </p>
              <p>
                Bankroll floor:{" "}
                <span className="font-medium text-zinc-200">
                  {formatCurrency(
                    state.settings.rules.minimumBankrollFloor,
                    state.settings.currency,
                  )}
                </span>
              </p>
              <p>
                Example baseline logic: each logged withdrawal increases the
                effective baseline by the configured trigger amount, making the
                next checkpoint clear after money has been secured.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total deposits"
          value={formatCurrency(bankrollState.totalDeposits, state.settings.currency)}
          icon={Landmark}
        />
        <StatCard
          title="Total withdrawals"
          value={formatCurrency(
            bankrollState.totalWithdrawals,
            state.settings.currency,
          )}
          icon={ArrowDownRight}
        />
        <StatCard
          title="Session win rate"
          value={formatPercent(filteredAnalytics.winRate)}
          icon={TrendingUp}
          subtitle={`${filteredSessions.filter((session) => session.profitLoss > 0).length} winning sessions`}
        />
        <StatCard
          title="Average buy-in"
          value={formatCurrency(
            filteredAnalytics.averageBuyIn,
            state.settings.currency,
          )}
          icon={Wallet}
          subtitle={`${filteredSessions.length} sessions in view`}
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            title="Trends and performance"
            description="Use quick filters to focus on recent form or long-term progress."
          />
          <Filters
            range={range}
            setRange={setRange}
            gameType={gameType}
            setGameType={setGameType}
            tag={tag}
            setTag={setTag}
            tagOptions={allTags}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Bankroll over time</CardTitle>
              <CardDescription>
                Includes deposits, session swings, and withdrawals.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              {chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="bankroll-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => formatDateLabel(value)}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                      tickFormatter={(value) =>
                        formatCurrency(value, state.settings.currency, 0)
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#09090b",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 16,
                        color: "#fafafa",
                      }}
                      formatter={(value) =>
                        formatTooltipCurrency(value as string | number | undefined, state.settings.currency)
                      }
                      labelFormatter={(value) => formatDateLabel(String(value))}
                    />
                    <Area
                      type="monotone"
                      dataKey="bankroll"
                      stroke="#38bdf8"
                      fill="url(#bankroll-fill)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="No chart data yet"
                  description="Log a few sessions or deposits to start seeing bankroll movement."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profit by game type</CardTitle>
              <CardDescription>Quick read on what performs best.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              {performanceByType.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceByType} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                      tickFormatter={(value) =>
                        formatCurrency(value, state.settings.currency, 0)
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="gameType"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#d4d4d8", fontSize: 12 }}
                      width={72}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#09090b",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 16,
                        color: "#fafafa",
                      }}
                      formatter={(value) =>
                        formatTooltipCurrency(value as string | number | undefined, state.settings.currency)
                      }
                    />
                    <Bar dataKey="profit" radius={[0, 10, 10, 0]}>
                      {performanceByType.map((item, index) => (
                        <Cell
                          key={item.gameType}
                          fill={
                            item.profit >= 0
                              ? GAME_COLORS[index % GAME_COLORS.length]
                              : "#fb7185"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="No filtered sessions"
                  description="Adjust the quick filters or add a session to compare formats."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal progress</CardTitle>
            <CardDescription>
              Running secured amount versus total bankroll performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {withdrawalChart.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={withdrawalChart}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => formatDateLabel(value)}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    tickFormatter={(value) =>
                      formatCurrency(value, state.settings.currency, 0)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#09090b",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      color: "#fafafa",
                    }}
                    formatter={(value) =>
                      formatTooltipCurrency(value as string | number | undefined, state.settings.currency)
                    }
                    labelFormatter={(value) => formatDateLabel(String(value))}
                  />
                  <Bar dataKey="withdrawn" fill="#a78bfa" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="No withdrawals logged"
                description="Track cash-outs separately to show how much is secured outside the roll."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance highlights</CardTitle>
            <CardDescription>
              Compact summary of the current filtered view.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <ArrowUpRight className="h-4 w-4 text-emerald-300" />
                  Biggest win
                </div>
                <p className="mt-3 text-xl font-semibold text-zinc-100">
                  {formatCurrency(
                    filteredAnalytics.biggestWin,
                    state.settings.currency,
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <TrendingDown className="h-4 w-4 text-rose-300" />
                  Biggest loss
                </div>
                <p className="mt-3 text-xl font-semibold text-zinc-100">
                  {formatCurrency(
                    filteredAnalytics.biggestLoss,
                    state.settings.currency,
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <CircleDollarSign className="h-4 w-4 text-sky-300" />
                  Avg session
                </div>
                <p className="mt-3 text-xl font-semibold text-zinc-100">
                  {formatCurrency(
                    filteredAnalytics.averageSessionResult,
                    state.settings.currency,
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Sparkles className="h-4 w-4 text-violet-300" />
                  Best game
                </div>
                <p className="mt-3 text-xl font-semibold text-zinc-100">
                  {filteredAnalytics.bestGameType}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Streaks
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-zinc-400">Longest upswing</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-100">
                    {filteredAnalytics.longestUpswing} sessions
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400">Longest downswing</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-100">
                    {filteredAnalytics.longestDownswing} sessions
                  </p>
                </div>
              </div>
            </div>

            {filteredAnalytics.recentSessions.length ? (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Recent sessions
                </p>
                {filteredAnalytics.recentSessions.map((session) => {
                  const profit = calculateSessionProfit(session.totalInvested, session.cashout);

                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-zinc-100">{session.gameType}</p>
                        <p className="text-sm text-zinc-400">
                          {formatDateLabel(session.date)} · {formatDuration(session.durationMinutes)}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "font-semibold",
                          profit >= 0 ? "text-emerald-300" : "text-rose-300",
                        )}
                      >
                        {formatCurrency(profit, state.settings.currency)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section id="log-session" className="space-y-4">
        <SectionHeading
          eyebrow="Sessions"
          title={editingSession ? "Edit session" : "Quick-add session"}
          description="Log a session in seconds, with profit/loss calculated automatically from invested and return."
        />
        <SessionForm
          currency={state.settings.currency}
          initialSession={editingSession}
          onCancel={() => setEditingSession(null)}
          onSubmit={(input) => {
            if (editingSession) {
              updateSession(editingSession.id, input);
              setEditingSession(null);
            } else {
              addSession(input);
            }
          }}
        />
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="History"
          title="Session history"
          description="Filter by tag or game type, then edit or delete entries without breaking derived bankroll math."
        />
        <SessionHistory
          sessions={[...filteredSessions].sort((a, b) => b.date.localeCompare(a.date))}
          currency={state.settings.currency}
          onEdit={(session) => setEditingSession(session)}
          onDelete={(id) => {
            if (editingSession?.id === id) {
              setEditingSession(null);
            }
            deleteSession(id);
          }}
        />
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Withdrawals"
          title="Secured money"
          description="Keep bankroll growth and money removed from play clearly separated."
          action={
            <Button asChild variant="secondary">
              <Link href="/settings">
                Settings
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          }
        />
        <WithdrawalPanel />
      </section>
    </div>
  );
}
