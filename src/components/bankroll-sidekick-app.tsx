"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Download,
  Filter,
  LayoutGrid,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  Table2,
  Tags,
  Trash2,
  Upload,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { createDefaultAppData, DEFAULT_TAGS, GAME_TYPES } from "@/lib/constants"
import {
  buildSession,
  calculateTotals,
  evaluateRules,
  filterSessions,
  getAllTags,
  getBankrollTier,
  getBankrollTimeline,
  getBestGameType,
  getSessionTypeSummary,
  getStreakSummary,
  getTodaySummary,
  getWithdrawalTimeline,
  round2,
  sortByDateDesc,
  toNumber,
  type FilterOptions,
} from "@/lib/bankroll"
import { formatCurrency, formatDateLabel, formatDuration, formatPercent } from "@/lib/format"
import { exportDataJson, normalizeAppData } from "@/lib/storage"
import { SEED_APP_DATA } from "@/lib/seed"
import type { AppData, GameType, RuleStatus, Session } from "@/lib/types"

interface Props {
  data: AppData
  onChange: (next: AppData) => void
}

interface SessionFormState {
  date: string
  gameType: GameType
  buyIn: string
  entries: string
  totalInvested: string
  cashout: string
  notes: string
  durationMinutes: string
  tags: string
}

interface MoneyFormState {
  date: string
  amount: string
  note: string
}

const EMPTY_SESSION_FORM: SessionFormState = {
  date: new Date().toISOString().slice(0, 10),
  gameType: "Spins",
  buyIn: "",
  entries: "1",
  totalInvested: "",
  cashout: "",
  notes: "",
  durationMinutes: "",
  tags: "",
}

const EMPTY_MONEY_FORM: MoneyFormState = {
  date: new Date().toISOString().slice(0, 10),
  amount: "",
  note: "",
}

function statusUi(status: RuleStatus) {
  switch (status) {
    case "safe-to-play":
      return {
        label: "Safe to play",
        tone: "text-emerald-300 border-emerald-400/30 bg-emerald-500/10",
        bannerTone: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
      }
    case "approaching-stop-loss":
      return {
        label: "Approaching stop-loss",
        tone: "text-amber-300 border-amber-400/30 bg-amber-500/10",
        bannerTone: "border-amber-400/50 bg-amber-500/15 text-amber-200",
      }
    case "withdrawal-available":
      return {
        label: "Withdrawal available",
        tone: "text-blue-300 border-blue-400/30 bg-blue-500/10",
        bannerTone: "border-blue-400/45 bg-blue-500/15 text-blue-200",
      }
    default:
      return {
        label: "Below bankroll floor",
        tone: "text-red-300 border-red-400/30 bg-red-500/10",
        bannerTone: "border-red-400/60 bg-red-500/20 text-red-200",
      }
  }
}

function metricTone(value: number) {
  if (value > 0) return "text-emerald-300"
  if (value < 0) return "text-red-300"
  return "text-muted-foreground"
}

const chartGrid = "rgba(148,163,184,0.12)"
const chartAxis = "#94a3b8"
const chartTooltipStyle = {
  background: "#1a1a1f",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: "10px",
  color: "#e5e7eb",
  fontSize: "12px",
  padding: "8px 12px",
}

function compactNumber(value: number) {
  return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(
    value
  )
}

function barTone(value: number) {
  return value >= 0 ? "#93c5fd" : "#fca5a5"
}

export function BankrollSidekickApp({ data, onChange }: Props) {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sessionHistoryView, setSessionHistoryView] = useState<"table" | "cards">("cards")
  const [sessionForm, setSessionForm] = useState<SessionFormState>(EMPTY_SESSION_FORM)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState("")

  const [withdrawalForm, setWithdrawalForm] = useState<MoneyFormState>(EMPTY_MONEY_FORM)
  const [depositForm, setDepositForm] = useState<MoneyFormState>(EMPTY_MONEY_FORM)
  const [moneyError, setMoneyError] = useState("")

  const [filters, setFilters] = useState<FilterOptions>({
    gameType: "All",
    tag: "All",
    range: "all",
  })

  const [importText, setImportText] = useState("")
  const [importError, setImportError] = useState("")
  const [importSuccess, setImportSuccess] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const totals = useMemo(() => calculateTotals(data), [data])
  const ruleEval = useMemo(
    () => evaluateRules(data, totals.bankroll),
    [data, totals.bankroll]
  )
  const tier = useMemo(
    () =>
      getBankrollTier(
        totals.bankroll,
        ruleEval.effectiveBaseline,
        data.settings.rules.minBankrollFloor,
        data.settings.rules.withdrawalTriggerAmount
      ),
    [
      totals.bankroll,
      ruleEval.effectiveBaseline,
      data.settings.rules.minBankrollFloor,
      data.settings.rules.withdrawalTriggerAmount,
    ]
  )
  const today = useMemo(() => getTodaySummary(data.sessions), [data.sessions])
  const allTags = useMemo(() => getAllTags(data.sessions), [data.sessions])
  const filteredSessions = useMemo(
    () => filterSessions(data.sessions, filters),
    [data.sessions, filters]
  )
  const sessionTypeSummary = useMemo(
    () => getSessionTypeSummary(data.sessions, filters.range),
    [data.sessions, filters.range]
  )
  const bestGameType = useMemo(
    () => getBestGameType(sessionTypeSummary),
    [sessionTypeSummary]
  )
  const bankrollTimeline = useMemo(() => getBankrollTimeline(data), [data])
  const withdrawalsTimeline = useMemo(
    () => getWithdrawalTimeline(data.withdrawals),
    [data.withdrawals]
  )
  const streak = useMemo(() => getStreakSummary(data.sessions), [data.sessions])

  const stateBadge = statusUi(ruleEval.status)
  const sortedWithdrawals = useMemo(
    () => sortByDateDesc(data.withdrawals),
    [data.withdrawals]
  )
  const sortedDeposits = useMemo(() => sortByDateDesc(data.deposits), [data.deposits])

  function updateSessionForm<K extends keyof SessionFormState>(
    key: K,
    value: SessionFormState[K]
  ) {
    setSessionForm((prev) => ({ ...prev, [key]: value }))
  }

  function resetSessionForm() {
    setSessionForm(EMPTY_SESSION_FORM)
    setEditingSessionId(null)
    setSessionError("")
  }

  function parseTags(value: string): string[] {
    return value
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10)
  }

  function appendTagToSessionForm(tag: string) {
    const currentTags = parseTags(sessionForm.tags)
    if (!currentTags.includes(tag)) {
      const next = [...currentTags, tag]
      setSessionForm((prev) => ({ ...prev, tags: next.join(", ") }))
    }
  }

  function upsertSession() {
    setSessionError("")
    const buyIn = round2(Math.max(0, toNumber(sessionForm.buyIn, 0)))
    const entries = Math.max(1, Math.floor(toNumber(sessionForm.entries, 1)))
    const totalInvested = round2(Math.max(0, toNumber(sessionForm.totalInvested, 0)))
    const cashout = round2(Math.max(0, toNumber(sessionForm.cashout, 0)))

    if (!sessionForm.date) {
      setSessionError("Please set a date.")
      return
    }

    if (buyIn <= 0 && totalInvested <= 0) {
      setSessionError("Enter buy-in or total invested.")
      return
    }

    const session = buildSession({
      id: editingSessionId ?? crypto.randomUUID(),
      date: sessionForm.date,
      gameType: sessionForm.gameType,
      buyIn,
      entries,
      totalInvested,
      cashout,
      notes: sessionForm.notes,
      durationMinutes: toNumber(sessionForm.durationMinutes, 0),
      tags: parseTags(sessionForm.tags),
    })

    const nextSessions = editingSessionId
      ? data.sessions.map((item) => (item.id === editingSessionId ? session : item))
      : [session, ...data.sessions]

    onChange({
      ...data,
      sessions: sortByDateDesc(nextSessions),
    })
    resetSessionForm()
  }

  function startEditSession(session: Session) {
    setSessionForm({
      date: session.date,
      gameType: session.gameType,
      buyIn: String(session.buyIn),
      entries: String(session.entries),
      totalInvested: String(session.totalInvested),
      cashout: String(session.cashout),
      notes: session.notes,
      durationMinutes: session.durationMinutes ? String(session.durationMinutes) : "",
      tags: session.tags.join(", "),
    })
    setEditingSessionId(session.id)
    setActiveTab("sessions")
  }

  function removeSession(id: string) {
    onChange({
      ...data,
      sessions: data.sessions.filter((session) => session.id !== id),
    })
  }

  function resetMoneyForm(target: "withdrawal" | "deposit") {
    if (target === "withdrawal") {
      setWithdrawalForm(EMPTY_MONEY_FORM)
    } else {
      setDepositForm(EMPTY_MONEY_FORM)
    }
    setMoneyError("")
  }

  function addWithdrawal() {
    setMoneyError("")
    const amount = round2(Math.max(0, toNumber(withdrawalForm.amount, 0)))
    if (!withdrawalForm.date || amount <= 0) {
      setMoneyError("Withdrawal date and amount are required.")
      return
    }
    onChange({
      ...data,
      withdrawals: sortByDateDesc([
        {
          id: crypto.randomUUID(),
          date: withdrawalForm.date,
          amount,
          note: withdrawalForm.note.trim(),
        },
        ...data.withdrawals,
      ]),
    })
    resetMoneyForm("withdrawal")
  }

  function addDeposit() {
    setMoneyError("")
    const amount = round2(Math.max(0, toNumber(depositForm.amount, 0)))
    if (!depositForm.date || amount <= 0) {
      setMoneyError("Deposit date and amount are required.")
      return
    }
    onChange({
      ...data,
      deposits: sortByDateDesc([
        {
          id: crypto.randomUUID(),
          date: depositForm.date,
          amount,
          note: depositForm.note.trim(),
        },
        ...data.deposits,
      ]),
    })
    resetMoneyForm("deposit")
  }

  function removeWithdrawal(id: string) {
    onChange({
      ...data,
      withdrawals: data.withdrawals.filter((item) => item.id !== id),
    })
  }

  function removeDeposit(id: string) {
    onChange({
      ...data,
      deposits: data.deposits.filter((item) => item.id !== id),
    })
  }

  function handleExport() {
    const payload = exportDataJson(data)
    const blob = new Blob([payload], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `bankroll-sidekick-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
    setImportSuccess("JSON backup downloaded.")
    setTimeout(() => setImportSuccess(""), 1800)
  }

  function loadImportedText(rawJson: string) {
    setImportError("")
    setImportSuccess("")
    const normalized = normalizeAppData(JSON.parse(rawJson))
    onChange(normalized)
    setImportText("")
    setImportSuccess("Backup imported successfully.")
    setActiveTab("dashboard")
  }

  function handleImportFromText() {
    setImportError("")
    setImportSuccess("")
    if (!importText.trim()) {
      setImportError("Paste JSON first.")
      return
    }

    try {
      loadImportedText(importText)
    } catch {
      setImportError("Import failed. Check JSON format.")
    }
  }

  async function handleImportFile(file: File) {
    try {
      const raw = await file.text()
      loadImportedText(raw)
    } catch {
      setImportError("Import failed. Could not read file.")
    }
  }

  const currency = data.settings.currency
  const autoInvested = round2(
    Math.max(0, toNumber(sessionForm.buyIn, 0)) *
      Math.max(1, Math.floor(toNumber(sessionForm.entries, 1)))
  )
  const investedPreview = round2(
    Math.max(0, toNumber(sessionForm.totalInvested, autoInvested))
  )
  const cashoutPreview = round2(Math.max(0, toNumber(sessionForm.cashout, 0)))
  const previewProfitLoss = round2(cashoutPreview - investedPreview)
  const amountToTrigger = round2(Math.max(0, ruleEval.triggerLine - totals.bankroll))
  const projectedBankrollAfterRecommendation = round2(
    totals.bankroll - ruleEval.suggestedWithdrawalValue
  )
  const projectedBaselineAfterRecommendation = round2(
    ruleEval.effectiveBaseline + ruleEval.suggestedWithdrawalValue
  )
  const ruleBuffer = round2(totals.bankroll - ruleEval.stopLossLine)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-3 pb-8 sm:gap-6 sm:p-5 sm:pb-10">
      <header className="sticky top-0 z-30 -mx-3 border-b border-border/60 bg-background/90 px-3 py-3 backdrop-blur-md sm:-mx-5 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Bankroll Sidekick
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Local-first poker bankroll and session tracker
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Badge className={`border px-2.5 py-1 text-[11px] font-medium ${stateBadge.tone}`}>
              {stateBadge.label}
            </Badge>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto rounded-none border-b border-border/40 p-0 text-xs sm:text-sm"
        >
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 pt-2 sm:space-y-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-zinc-700/60 bg-gradient-to-br from-zinc-900 to-zinc-950 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium uppercase tracking-wider text-zinc-500">Current bankroll</CardDescription>
                <CardTitle className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {formatCurrency(totals.bankroll, currency)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="grid gap-2.5 text-sm sm:grid-cols-3">
                  <div className="rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-3.5 py-2.5">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Total P/L</p>
                    <p className={`mt-0.5 text-base font-semibold ${metricTone(totals.totalProfitLoss)}`}>
                      {formatCurrency(totals.totalProfitLoss, currency)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-3.5 py-2.5">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Tier</p>
                    <p className="mt-0.5 text-base font-semibold text-zinc-100">{tier.label}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-3.5 py-2.5">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Today</p>
                    <p className={`mt-0.5 text-base font-semibold ${metricTone(today.profitLoss)}`}>
                      {today.sessions} sessions · {formatCurrency(today.profitLoss, currency)}
                    </p>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-zinc-500">{tier.note}</p>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card className={`border-l-4 ${stateBadge.bannerTone}`}>
                <CardContent className="flex items-start gap-3 p-4">
                  {ruleEval.status === "safe-to-play" || ruleEval.status === "withdrawal-available" ? (
                    <ShieldCheck className="mt-0.5 size-5 shrink-0" />
                  ) : ruleEval.status === "approaching-stop-loss" ? (
                    <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                  ) : (
                    <ShieldAlert className="mt-0.5 size-5 shrink-0" />
                  )}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold">{stateBadge.label}</p>
                      <Badge variant="outline" className="h-5 border-current/40 text-[10px] font-medium">
                        bankroll state
                      </Badge>
                    </div>
                    <p className="text-[13px] leading-relaxed opacity-90">{ruleEval.explanation}</p>
                    <p className="text-xs opacity-70">
                      Buffer to stop-loss: {formatCurrency(ruleBuffer, currency)} · floor:{" "}
                      {formatCurrency(data.settings.rules.minBankrollFloor, currency)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Withdrawal recommendation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-[13px]">
                  {ruleEval.suggestedWithdrawalCount > 0 ? (
                    <>
                      <p className="font-semibold text-blue-300">
                        Withdraw {ruleEval.suggestedWithdrawalCount} ×{" "}
                        {formatCurrency(data.settings.rules.withdrawalAmount, currency)} ={" "}
                        {formatCurrency(ruleEval.suggestedWithdrawalValue, currency)}
                      </p>
                      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                        <p>
                          projected bankroll: {formatCurrency(totals.bankroll, currency)} -{" "}
                          {formatCurrency(ruleEval.suggestedWithdrawalValue, currency)} ={" "}
                          {formatCurrency(projectedBankrollAfterRecommendation, currency)}
                        </p>
                        <p>
                          projected baseline: {formatCurrency(ruleEval.effectiveBaseline, currency)} +{" "}
                          {formatCurrency(ruleEval.suggestedWithdrawalValue, currency)} ={" "}
                          {formatCurrency(projectedBaselineAfterRecommendation, currency)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="leading-relaxed">
                        No withdrawal yet. Need{" "}
                        <span className="font-semibold text-foreground">
                          {formatCurrency(amountToTrigger, currency)}
                        </span>{" "}
                        more to hit the next trigger.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Trigger line = {formatCurrency(ruleEval.triggerLine, currency)} from current
                        baseline {formatCurrency(ruleEval.effectiveBaseline, currency)}.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
            <Card>
              <CardContent className="px-3.5 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Win rate</p>
                <p className="mt-1 text-base font-semibold">{formatPercent(totals.sessionWinRate)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-3.5 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Avg buy-in</p>
                <p className="mt-1 text-base font-semibold">{formatCurrency(totals.averageBuyIn, currency)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-3.5 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Avg result</p>
                <p className={`mt-1 text-base font-semibold ${metricTone(totals.averageSessionResult)}`}>
                  {formatCurrency(totals.averageSessionResult, currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-3.5 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Biggest win</p>
                <p className={`mt-1 text-base font-semibold ${metricTone(totals.biggestWin)}`}>
                  {formatCurrency(totals.biggestWin, currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-3.5 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Biggest loss</p>
                <p className={`mt-1 text-base font-semibold ${metricTone(totals.biggestLoss)}`}>
                  {formatCurrency(totals.biggestLoss, currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-3.5 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Best game</p>
                <p className="mt-1 truncate text-base font-semibold">
                  {bestGameType ? bestGameType.gameType : "N/A"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Bankroll trend snapshot</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bankrollTimeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={chartGrid} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      tick={{ fill: chartAxis, fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(value) => compactNumber(Number(value))}
                      tick={{ fill: chartAxis, fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip
                      formatter={(value: unknown) => formatCurrency(Number(value ?? 0), currency)}
                      labelFormatter={(label) => String(label)}
                      contentStyle={chartTooltipStyle}
                    />
                    <Area
                      type="monotone"
                      dataKey="bankroll"
                      stroke="#cbd5e1"
                      fill="rgba(203,213,225,0.18)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Quick performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-[13px]">
                <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                  <span className="text-muted-foreground">Longest upswing</span>
                  <span className="font-medium">{streak.longestUpswing}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                  <span className="text-muted-foreground">Longest downswing</span>
                  <span className="font-medium">{streak.longestDownswing}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                  <span className="text-muted-foreground">Current streak</span>
                  <span className="font-medium">
                    {streak.currentLength} {streak.currentDirection}
                  </span>
                </div>
                <Separator className="my-1" />
                <div className="rounded-lg border border-border/60 px-3 py-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Rule math</p>
                  <div className="mt-1.5 space-y-0.5 text-xs">
                    <p>baseline: {formatCurrency(ruleEval.effectiveBaseline, currency)}</p>
                    <p>stop-loss: {formatCurrency(ruleEval.stopLossLine, currency)}</p>
                    <p>trigger: {formatCurrency(ruleEval.triggerLine, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4 pt-2 sm:space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <PlusCircle className="size-4" />
                  {editingSessionId ? "Edit session" : "Quick-add session"}
                </CardTitle>
                <CardDescription className="text-[13px]">
                  Profit/loss auto-calculates from invested and cashout.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Date</label>
                    <Input
                      type="date"
                      value={sessionForm.date}
                      onChange={(event) => updateSessionForm("date", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Game type</label>
                    <Select
                      value={sessionForm.gameType}
                      onValueChange={(value) =>
                        updateSessionForm("gameType", value as GameType)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GAME_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Buy-in</label>
                    <Input
                      inputMode="decimal"
                      value={sessionForm.buyIn}
                      onChange={(event) => updateSessionForm("buyIn", event.target.value)}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Entries / rebuys
                    </label>
                    <Input
                      inputMode="numeric"
                      value={sessionForm.entries}
                      onChange={(event) => updateSessionForm("entries", event.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Total invested
                    </label>
                    <Input
                      inputMode="decimal"
                      value={sessionForm.totalInvested}
                      onChange={(event) =>
                        updateSessionForm("totalInvested", event.target.value)
                      }
                      placeholder="auto if empty"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Cashout / return
                    </label>
                    <Input
                      inputMode="decimal"
                      value={sessionForm.cashout}
                      onChange={(event) => updateSessionForm("cashout", event.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Duration (minutes)
                    </label>
                    <Input
                      inputMode="numeric"
                      value={sessionForm.durationMinutes}
                      onChange={(event) =>
                        updateSessionForm("durationMinutes", event.target.value)
                      }
                      placeholder="optional"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Tags (comma separated)
                    </label>
                    <Input
                      value={sessionForm.tags}
                      onChange={(event) => updateSessionForm("tags", event.target.value)}
                      placeholder="tilt, good quit"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Notes</label>
                  <Textarea
                    value={sessionForm.notes}
                    onChange={(event) => updateSessionForm("notes", event.target.value)}
                    placeholder="Quick read on session quality and mistakes..."
                  />
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Quick tag chips</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {DEFAULT_TAGS.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => appendTagToSessionForm(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-[13px]">
                  <span className="text-muted-foreground">Session P/L preview: </span>
                  <span className={`font-semibold ${metricTone(previewProfitLoss)}`}>
                    {formatCurrency(previewProfitLoss, currency)}
                  </span>
                </div>

                {sessionError ? (
                  <p className="text-[13px] font-medium text-red-300">{sessionError}</p>
                ) : null}
                <div className="flex gap-2 pt-1">
                  <Button onClick={upsertSession} className="flex-1 font-semibold">
                    {editingSessionId ? "Save changes" : "Add session"}
                  </Button>
                  {editingSessionId ? (
                    <Button variant="outline" onClick={resetSessionForm}>
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Filter className="size-4" />
                  Session filters
                </CardTitle>
                <CardDescription className="text-[13px]">Filter by game type, tag, and time range.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <Select
                    value={filters.range}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        range: value as FilterOptions["range"],
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7d</SelectItem>
                      <SelectItem value="30d">Last 30d</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.gameType}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        gameType: value as FilterOptions["gameType"],
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Game type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All games</SelectItem>
                      {GAME_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.tag}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, tag: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All tags</SelectItem>
                      {allTags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/10 px-3.5 py-2.5 text-[13px]">
                  <p className="text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{filteredSessions.length}</span>{" "}
                    sessions
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 p-3.5">
                  <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Popular tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.length ? (
                      allTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={filters.tag === tag ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              tag: prev.tag === tag ? "All" : tag,
                            }))
                          }
                        >
                          <Tags className="size-3" /> {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Tags appear once sessions are tagged.
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-semibold">Session history</CardTitle>
                <div className="flex items-center gap-1 rounded-lg border border-border/60 p-1">
                  <Button
                    variant={sessionHistoryView === "table" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setSessionHistoryView("table")}
                  >
                    <Table2 className="size-3.5" />
                    <span className="hidden sm:inline">Table</span>
                  </Button>
                  <Button
                    variant={sessionHistoryView === "cards" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setSessionHistoryView("cards")}
                  >
                    <LayoutGrid className="size-3.5" />
                    <span className="hidden sm:inline">Cards</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-hidden">
              {sessionHistoryView === "table" ? (
                <div className="max-h-[28rem] overflow-auto rounded-lg border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Game</TableHead>
                        <TableHead>Invested</TableHead>
                        <TableHead>Cashout</TableHead>
                        <TableHead>P/L</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSessions.length ? (
                        filteredSessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>{session.date}</TableCell>
                            <TableCell>{session.gameType}</TableCell>
                            <TableCell>
                              {formatCurrency(session.totalInvested, currency)}
                            </TableCell>
                            <TableCell>{formatCurrency(session.cashout, currency)}</TableCell>
                            <TableCell className={metricTone(session.profitLoss)}>
                              {formatCurrency(session.profitLoss, currency)}
                            </TableCell>
                            <TableCell>{formatDuration(session.durationMinutes)}</TableCell>
                            <TableCell>
                              <div className="flex max-w-[12rem] flex-wrap gap-1">
                                {session.tags.map((tag) => (
                                  <Badge key={tag} variant="outline">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[16rem] truncate text-muted-foreground">
                              {session.notes || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEditSession(session)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeSession(session.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="py-8 text-center text-muted-foreground"
                          >
                            No sessions for this filter.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredSessions.length ? (
                    filteredSessions.map((session) => (
                      <div
                        key={session.id}
                        className="rounded-lg border border-border/60 bg-muted/10 p-3.5 text-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{session.gameType}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{session.date}</p>
                          </div>
                          <p className={`text-base font-bold ${metricTone(session.profitLoss)}`}>
                            {formatCurrency(session.profitLoss, currency)}
                          </p>
                        </div>
                        <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                          <p>Invested: {formatCurrency(session.totalInvested, currency)}</p>
                          <p>Cashout: {formatCurrency(session.cashout, currency)}</p>
                          <p>Duration: {formatDuration(session.durationMinutes)}</p>
                          <p>Entries: {session.entries}</p>
                        </div>
                        {session.tags.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {session.tags.map((tag) => (
                              <Badge key={tag} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                          {session.notes || "No notes."}
                        </p>
                        <div className="mt-3 flex justify-end gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => startEditSession(session)}>
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSession(session.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-lg border border-border/70 p-4 text-center text-sm text-muted-foreground">
                      No sessions for this filter.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4 pt-2 sm:space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <ArrowDownCircle className="size-4" />
                  Log withdrawal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <Input
                    type="date"
                    value={withdrawalForm.date}
                    onChange={(event) =>
                      setWithdrawalForm((prev) => ({ ...prev, date: event.target.value }))
                    }
                  />
                  <Input
                    inputMode="decimal"
                    placeholder="Amount"
                    value={withdrawalForm.amount}
                    onChange={(event) =>
                      setWithdrawalForm((prev) => ({ ...prev, amount: event.target.value }))
                    }
                  />
                </div>
                <Input
                  placeholder="Note (optional)"
                  value={withdrawalForm.note}
                  onChange={(event) =>
                    setWithdrawalForm((prev) => ({ ...prev, note: event.target.value }))
                  }
                />
                <Button size="sm" onClick={addWithdrawal} className="w-full font-semibold">
                  Add withdrawal
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <ArrowUpCircle className="size-4" />
                  Log deposit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <Input
                    type="date"
                    value={depositForm.date}
                    onChange={(event) =>
                      setDepositForm((prev) => ({ ...prev, date: event.target.value }))
                    }
                  />
                  <Input
                    inputMode="decimal"
                    placeholder="Amount"
                    value={depositForm.amount}
                    onChange={(event) =>
                      setDepositForm((prev) => ({ ...prev, amount: event.target.value }))
                    }
                  />
                </div>
                <Input
                  placeholder="Note (optional)"
                  value={depositForm.note}
                  onChange={(event) =>
                    setDepositForm((prev) => ({ ...prev, note: event.target.value }))
                  }
                />
                <Button variant="outline" size="sm" onClick={addDeposit} className="w-full font-semibold">
                  Add deposit
                </Button>
              </CardContent>
            </Card>
          </div>
          {moneyError ? <p className="text-sm text-red-300">{moneyError}</p> : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Withdrawal history</CardTitle>
                <CardDescription className="text-[13px]">
                  Secured outside bankroll:{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(totals.totalWithdrawals, currency)}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {sortedWithdrawals.length ? (
                  sortedWithdrawals.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 p-3.5 text-sm"
                    >
                      <div>
                        <p className="font-medium">{formatCurrency(item.amount, currency)}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.date} {item.note ? `· ${item.note}` : ""}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeWithdrawal(item.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No withdrawals yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Deposit history</CardTitle>
                <CardDescription className="text-[13px]">
                  Added to bankroll:{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(totals.totalDeposits, currency)}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {sortedDeposits.length ? (
                  sortedDeposits.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 p-3.5 text-sm"
                    >
                      <div>
                        <p className="font-medium">{formatCurrency(item.amount, currency)}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.date} {item.note ? `· ${item.note}` : ""}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon-sm" onClick={() => removeDeposit(item.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No deposits yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 pt-2 sm:space-y-5">
          <div className="grid grid-cols-3 gap-2.5">
            <Button
              variant={filters.range === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters((prev) => ({ ...prev, range: "7d" }))}
            >
              Last 7d
            </Button>
            <Button
              variant={filters.range === "30d" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters((prev) => ({ ...prev, range: "30d" }))}
            >
              Last 30d
            </Button>
            <Button
              variant={filters.range === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters((prev) => ({ ...prev, range: "all" }))}
            >
              All time
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <BarChart3 className="size-4" />
                Bankroll over time
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bankrollTimeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={chartGrid} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    tick={{ fill: chartAxis, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => compactNumber(Number(value))}
                    tick={{ fill: chartAxis, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip
                    formatter={(value) => formatCurrency(Number(value ?? 0), currency)}
                    labelFormatter={(label) => String(label)}
                    contentStyle={chartTooltipStyle}
                  />
                  <Area
                    type="monotone"
                    dataKey="bankroll"
                    stroke="#e2e8f0"
                    fill="rgba(148,163,184,0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Profit/Loss by game type</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionTypeSummary} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={chartGrid} vertical={false} />
                    <XAxis
                      dataKey="gameType"
                      tick={{ fill: chartAxis, fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(value) => compactNumber(Number(value))}
                      tick={{ fill: chartAxis, fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip
                      formatter={(value: unknown) => formatCurrency(Number(value ?? 0), currency)}
                      contentStyle={chartTooltipStyle}
                    />
                    <Bar dataKey="totalProfitLoss" radius={[4, 4, 0, 0]}>
                      {sessionTypeSummary.map((entry) => (
                        <Cell key={entry.gameType} fill={barTone(entry.totalProfitLoss)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Withdrawals over time</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={withdrawalsTimeline}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid stroke={chartGrid} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      tick={{ fill: chartAxis, fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(value) => compactNumber(Number(value))}
                      tick={{ fill: chartAxis, fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip
                      formatter={(value: unknown) => formatCurrency(Number(value ?? 0), currency)}
                      contentStyle={chartTooltipStyle}
                    />
                    <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: "12px" }} />
                    <Line
                      type="monotone"
                      dataKey="withdrawal"
                      name="Daily withdrawal"
                      stroke="#facc15"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      name="Cumulative secured"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Session type summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto rounded-lg border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Game type</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Total P/L</TableHead>
                      <TableHead>Avg result</TableHead>
                      <TableHead>Win rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionTypeSummary.map((summary) => (
                      <TableRow key={summary.gameType}>
                        <TableCell>{summary.gameType}</TableCell>
                        <TableCell>{summary.sessions}</TableCell>
                        <TableCell className={metricTone(summary.totalProfitLoss)}>
                          {formatCurrency(summary.totalProfitLoss, currency)}
                        </TableCell>
                        <TableCell className={metricTone(summary.averageResult)}>
                          {formatCurrency(summary.averageResult, currency)}
                        </TableCell>
                        <TableCell>{formatPercent(summary.winRate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4 pt-2 sm:space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Backup and restore</CardTitle>
              <CardDescription className="text-[13px]">
                Export full JSON backups or import a previous backup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2.5">
                <Button size="sm" onClick={handleExport} className="font-semibold">
                  <Download className="size-4" />
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChange(normalizeAppData(SEED_APP_DATA))}
                >
                  Load seed data
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      void handleImportFile(file)
                    }
                    event.currentTarget.value = ""
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fileInputRef.current?.click()
                  }}
                >
                  <Upload className="size-4" />
                  Import from file
                </Button>
              </div>
              <Textarea
                rows={10}
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                placeholder="Paste full JSON backup here and click Import JSON."
              />
              {importError ? <p className="text-[13px] font-medium text-red-300">{importError}</p> : null}
              {importSuccess ? <p className="text-[13px] font-medium text-emerald-300">{importSuccess}</p> : null}
              <div className="flex flex-wrap gap-2.5">
                <Button variant="outline" size="sm" onClick={handleImportFromText}>
                  <Upload className="size-4" />
                  Import JSON
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="size-4" />
                      Reset all data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset everything?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This deletes all sessions, withdrawals, deposits, and settings.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onChange(createDefaultAppData())}>
                        Reset now
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Current bankroll formula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-[13px] text-muted-foreground">
                bankroll = starting bankroll + deposits - withdrawals + total session P/L
              </p>
              <div className="rounded-lg border border-border/60 bg-muted/10 p-3.5">
                <p>
                  {formatCurrency(data.settings.startingBankroll, currency)} +{" "}
                  {formatCurrency(totals.totalDeposits, currency)} -{" "}
                  {formatCurrency(totals.totalWithdrawals, currency)} +{" "}
                  {formatCurrency(totals.totalProfitLoss, currency)} ={" "}
                  <span className="font-semibold">
                    {formatCurrency(totals.bankroll, currency)}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
