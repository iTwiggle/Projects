import { DEFAULT_APP_DATA, STORAGE_KEY, createDefaultAppData } from "@/lib/constants"
import { buildSession, round2, toNumber } from "@/lib/bankroll"
import type { AppData, AppSettings, Deposit, Session, Withdrawal } from "@/lib/types"

function safeString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function safeDate(value: unknown): string {
  const raw = safeString(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw
  }
  return new Date().toISOString().slice(0, 10)
}

function safeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((tag) => safeString(tag).trim())
    .filter(Boolean)
    .slice(0, 10)
}

function normalizeSession(value: unknown): Session | null {
  if (!value || typeof value !== "object") {
    return null
  }
  const raw = value as Partial<Session>
  const gameType =
    raw.gameType === "Spins" ||
    raw.gameType === "MTT" ||
    raw.gameType === "Cash" ||
    raw.gameType === "Other"
      ? raw.gameType
      : "Other"

  const session = buildSession({
    id: safeString(raw.id) || crypto.randomUUID(),
    date: safeDate(raw.date),
    gameType,
    buyIn: toNumber(raw.buyIn, 0),
    entries: toNumber(raw.entries, 1),
    totalInvested: toNumber(raw.totalInvested, 0),
    cashout: toNumber(raw.cashout, 0),
    notes: safeString(raw.notes),
    durationMinutes: toNumber(raw.durationMinutes, 0),
    tags: safeTags(raw.tags),
  })

  return session
}

function normalizeWithdrawal(value: unknown): Withdrawal | null {
  if (!value || typeof value !== "object") {
    return null
  }
  const raw = value as Partial<Withdrawal>
  const amount = round2(Math.max(0, toNumber(raw.amount, 0)))
  if (amount <= 0) {
    return null
  }
  return {
    id: safeString(raw.id) || crypto.randomUUID(),
    date: safeDate(raw.date),
    amount,
    note: safeString(raw.note).trim(),
  }
}

function normalizeDeposit(value: unknown): Deposit | null {
  if (!value || typeof value !== "object") {
    return null
  }
  const raw = value as Partial<Deposit>
  const amount = round2(Math.max(0, toNumber(raw.amount, 0)))
  if (amount < 0) {
    return null
  }
  return {
    id: safeString(raw.id) || crypto.randomUUID(),
    date: safeDate(raw.date),
    amount,
    note: safeString(raw.note).trim(),
  }
}

function normalizeSettings(value: unknown): AppSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_APP_DATA.settings
  }

  const raw = value as Partial<AppSettings>
  const currency = safeString(raw.currency).toUpperCase() || "USD"
  return {
    startingBankroll: round2(Math.max(0, toNumber(raw.startingBankroll, 0))),
    currency,
    rules: {
      stopLossAmount: round2(
        Math.max(0, toNumber(raw.rules?.stopLossAmount, 0))
      ),
      withdrawalTriggerAmount: round2(
        Math.max(0, toNumber(raw.rules?.withdrawalTriggerAmount, 0))
      ),
      withdrawalAmount: round2(
        Math.max(0, toNumber(raw.rules?.withdrawalAmount, 0))
      ),
      minBankrollFloor: round2(
        Math.max(0, toNumber(raw.rules?.minBankrollFloor, 0))
      ),
    },
  }
}

export function normalizeAppData(input: unknown): AppData {
  if (!input || typeof input !== "object") {
    return DEFAULT_APP_DATA
  }

  const raw = input as Partial<AppData>
  const sessions = Array.isArray(raw.sessions)
    ? raw.sessions.reduce<Session[]>((acc, value) => {
        const normalized = normalizeSession(value)
        if (normalized) {
          acc.push(normalized)
        }
        return acc
      }, [])
    : []
  const withdrawals = Array.isArray(raw.withdrawals)
    ? raw.withdrawals.reduce<Withdrawal[]>((acc, value) => {
        const normalized = normalizeWithdrawal(value)
        if (normalized) {
          acc.push(normalized)
        }
        return acc
      }, [])
    : []
  const deposits = Array.isArray(raw.deposits)
    ? raw.deposits.reduce<Deposit[]>((acc, value) => {
        const normalized = normalizeDeposit(value)
        if (normalized) {
          acc.push(normalized)
        }
        return acc
      }, [])
    : []

  return {
    settings: normalizeSettings(raw.settings),
    sessions,
    withdrawals,
    deposits,
  }
}

export function loadAppData(): AppData {
  if (typeof window === "undefined") {
    return createDefaultAppData()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return createDefaultAppData()
    }
    return normalizeAppData(JSON.parse(raw))
  } catch {
    return createDefaultAppData()
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function exportDataJson(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

