"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Download,
  Filter,
  PlusCircle,
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
      }
    case "approaching-stop-loss":
      return {
        label: "Approaching stop-loss",
        tone: "text-amber-300 border-amber-400/30 bg-amber-500/10",
      }
    case "withdrawal-available":
      return {
        label: "Withdrawal available",
        tone: "text-blue-300 border-blue-400/30 bg-blue-500/10",
      }
    default:
      return {
        label: "Below bankroll floor",
        tone: "text-red-300 border-red-400/30 bg-red-500/10",
      }
  }
}

function metricTone(value: number) {
  if (value > 0) return "text-emerald-300"
  if (value < 0) return "text-red-300"
  return "text-muted-foreground"
}

export function BankrollSidekickApp({ data, onChange }: Props) {
  const [activeTab, setActiveTab] = useState("dashboard")
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
  const sortedSessions = useMemo(() => sortByDateDesc(data.sessions), [data.sessions])
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-3 pb-8 sm:gap-6 sm:p-6">
      <header className="sticky top-0 z-30 -mx-3 border-b border-border/70 bg-background/85 px-3 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Bankroll Sidekick
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Local-first poker bankroll and session tracker.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`border ${stateBadge.tone}`}>{stateBadge.label}</Badge>
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
          className="w-full justify-start overflow-x-auto rounded-none p-0"
        >
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 pt-2 sm:space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-zinc-700/70 bg-gradient-to-b from-zinc-900 to-zinc-950">
              <CardHeader>
                <CardDescription className="text-zinc-400">Current bankroll</CardDescription>
                <CardTitle className="text-2xl">
                  {formatCurrency(totals.bankroll, currency)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Total P/L</CardDescription>
                <CardTitle className={metricTone(totals.totalProfitLoss)}>
                  {formatCurrency(totals.totalProfitLoss, currency)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Total withdrawals</CardDescription>
                <CardTitle>{formatCurrency(totals.totalWithdrawals, currency)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Total deposits</CardDescription>
                <CardTitle>{formatCurrency(totals.totalDeposits, currency)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription>Session win rate</CardDescription>
                <CardTitle>{formatPercent(totals.sessionWinRate)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Average buy-in</CardDescription>
                <CardTitle>{formatCurrency(totals.averageBuyIn, currency)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Bankroll tier</CardDescription>
                <CardTitle>{tier.label}</CardTitle>
                <CardDescription>{tier.note}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Today&apos;s status</CardDescription>
                <CardTitle className={metricTone(today.profitLoss)}>
                  {today.sessions} sessions · {formatCurrency(today.profitLoss, currency)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Rule state explanation</CardTitle>
                <CardDescription>
                  Baseline logic updates after each completed withdrawal cycle.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
                    <p className="text-xs text-muted-foreground">Effective baseline</p>
                    <p className="mt-1 font-medium">
                      {formatCurrency(ruleEval.effectiveBaseline, currency)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
                    <p className="text-xs text-muted-foreground">Stop-loss line</p>
                    <p className="mt-1 font-medium">
                      {formatCurrency(ruleEval.stopLossLine, currency)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
                    <p className="text-xs text-muted-foreground">Withdrawal trigger</p>
                    <p className="mt-1 font-medium">
                      {formatCurrency(ruleEval.triggerLine, currency)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
                    <p className="text-xs text-muted-foreground">Cycles completed</p>
                    <p className="mt-1 font-medium">{ruleEval.cyclesCompleted}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
                  <p className="font-medium">{stateBadge.label}</p>
                  <p className="mt-1 text-muted-foreground">{ruleEval.explanation}</p>
                  {ruleEval.suggestedWithdrawalCount > 0 ? (
                    <p className="mt-2 text-blue-300">
                      Suggested withdrawals: {ruleEval.suggestedWithdrawalCount} (
                      {formatCurrency(ruleEval.suggestedWithdrawalValue, currency)})
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-md border border-border/70 p-2">
                  <span className="text-muted-foreground">Biggest win</span>
                  <span className={metricTone(totals.biggestWin)}>
                    {formatCurrency(totals.biggestWin, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border/70 p-2">
                  <span className="text-muted-foreground">Biggest loss</span>
                  <span className={metricTone(totals.biggestLoss)}>
                    {formatCurrency(totals.biggestLoss, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border/70 p-2">
                  <span className="text-muted-foreground">Avg session result</span>
                  <span className={metricTone(totals.averageSessionResult)}>
                    {formatCurrency(totals.averageSessionResult, currency)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between rounded-md border border-border/70 p-2">
                  <span className="text-muted-foreground">Longest upswing</span>
                  <span>{streak.longestUpswing}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border/70 p-2">
                  <span className="text-muted-foreground">Longest downswing</span>
                  <span>{streak.longestDownswing}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border/70 p-2">
                  <span className="text-muted-foreground">Current streak</span>
                  <span>
                    {streak.currentLength} {streak.currentDirection}
                  </span>
                </div>
                <Separator />
                <div className="rounded-lg border border-border/70 p-3">
                  <p className="text-xs text-muted-foreground">Best game type</p>
                  <p className="mt-1 font-medium">
                    {bestGameType
                      ? `${bestGameType.gameType} (${formatCurrency(
                          bestGameType.averageResult,
                          currency
                        )} avg)`
                      : "Not enough data"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bankroll trend snapshot</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bankrollTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(Number(value), currency)}
                    labelFormatter={(label) => String(label)}
                  />
                  <Area
                    type="monotone"
                    dataKey="bankroll"
                    stroke="#c4c4c4"
                    fill="rgba(196,196,196,0.16)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4 pt-2 sm:space-y-6">
          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PlusCircle className="size-4" />
                  {editingSessionId ? "Edit session" : "Quick-add session"}
                </CardTitle>
                <CardDescription>
                  Profit/loss auto-calculates from invested and cashout.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Date</label>
                    <Input
                      type="date"
                      value={sessionForm.date}
                      onChange={(event) => updateSessionForm("date", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Game type</label>
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

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Buy-in</label>
                    <Input
                      inputMode="decimal"
                      value={sessionForm.buyIn}
                      onChange={(event) => updateSessionForm("buyIn", event.target.value)}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
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
                    <label className="mb-1 block text-xs text-muted-foreground">
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
                    <label className="mb-1 block text-xs text-muted-foreground">
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

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
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
                    <label className="mb-1 block text-xs text-muted-foreground">
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
                  <label className="mb-1 block text-xs text-muted-foreground">Notes</label>
                  <Textarea
                    value={sessionForm.notes}
                    onChange={(event) => updateSessionForm("notes", event.target.value)}
                    placeholder="Quick read on session quality and mistakes..."
                  />
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/30 p-2">
                  <p className="text-xs text-muted-foreground">Quick tag chips</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {DEFAULT_TAGS.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => appendTagToSessionForm(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/30 p-2 text-xs">
                  <span className="text-muted-foreground">Session P/L preview: </span>
                  <span className={metricTone(previewProfitLoss)}>
                    {formatCurrency(previewProfitLoss, currency)}
                  </span>
                </div>

                {sessionError ? (
                  <p className="text-xs text-red-300">{sessionError}</p>
                ) : null}
                <div className="flex gap-2">
                  <Button onClick={upsertSession} className="flex-1">
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Filter className="size-4" />
                  Session filters
                </CardTitle>
                <CardDescription>Filter by game type, tag, and time range.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
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

                <div className="rounded-lg border border-border/70 p-3 text-sm">
                  <p className="text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{filteredSessions.length}</span>{" "}
                    sessions.
                  </p>
                </div>

                <div className="rounded-lg border border-border/70 p-3">
                  <p className="mb-2 text-xs text-muted-foreground">Popular tags</p>
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
            <CardHeader>
              <CardTitle className="text-base">Session history</CardTitle>
            </CardHeader>
            <CardContent className="overflow-hidden">
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
                        <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                          No sessions for this filter.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4 pt-2 sm:space-y-6">
          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ArrowDownCircle className="size-4" />
                  Log withdrawal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
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
                <Button onClick={addWithdrawal} className="w-full">
                  Add withdrawal
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ArrowUpCircle className="size-4" />
                  Log deposit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
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
                <Button variant="outline" onClick={addDeposit} className="w-full">
                  Add deposit
                </Button>
              </CardContent>
            </Card>
          </div>
          {moneyError ? <p className="text-sm text-red-300">{moneyError}</p> : null}

          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Withdrawal history</CardTitle>
                <CardDescription>
                  Secured outside bankroll:{" "}
                  <span className="font-medium">
                    {formatCurrency(totals.totalWithdrawals, currency)}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {sortedWithdrawals.length ? (
                  sortedWithdrawals.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border/70 p-3 text-sm"
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
              <CardHeader>
                <CardTitle className="text-base">Deposit history</CardTitle>
                <CardDescription>
                  Added to bankroll:{" "}
                  <span className="font-medium">
                    {formatCurrency(totals.totalDeposits, currency)}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {sortedDeposits.length ? (
                  sortedDeposits.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border/70 p-3 text-sm"
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

        <TabsContent value="analytics" className="space-y-4 pt-2 sm:space-y-6">
          <div className="grid grid-cols-3 gap-2">
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="size-4" />
                Bankroll over time
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bankrollTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(Number(value), currency)}
                    labelFormatter={(label) => String(label)}
                  />
                  <Area
                    type="monotone"
                    dataKey="bankroll"
                    stroke="#c4c4c4"
                    fill="rgba(196,196,196,0.16)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profit/Loss by game type</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionTypeSummary}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="gameType" />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(Number(value), currency)}
                    />
                    <Bar dataKey="totalProfitLoss" fill="#9ca3af" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Withdrawals over time</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={withdrawalsTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(Number(value), currency)}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="withdrawal" stroke="#a3e635" strokeWidth={2} />
                    <Line type="monotone" dataKey="cumulative" stroke="#38bdf8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Session type summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto rounded-lg border border-border/70">
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

        <TabsContent value="data" className="space-y-4 pt-2 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Backup and restore</CardTitle>
              <CardDescription>
                Export full JSON backups or import a previous backup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleExport}>
                  <Download className="size-4" />
                  Export JSON
                </Button>
                <Button
                  variant="outline"
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
              {importError ? <p className="text-sm text-red-300">{importError}</p> : null}
              {importSuccess ? <p className="text-sm text-emerald-300">{importSuccess}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleImportFromText}>
                  <Upload className="size-4" />
                  Import JSON
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
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
            <CardHeader>
              <CardTitle className="text-base">Current bankroll formula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                bankroll = starting bankroll + deposits - withdrawals + total session P/L
              </p>
              <div className="rounded-lg border border-border/70 p-3">
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
