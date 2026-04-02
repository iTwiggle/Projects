"use client";

import { createSeedAppState } from "@/lib/seed-data";
import type {
  AppSettings,
  AppState,
  DepositRecord,
  SessionInput,
  SessionRecord,
  WithdrawalRecord,
} from "@/lib/types";
import { clampNumber, parseTags, toNumber } from "@/lib/utils";

const asDate = (value: unknown) =>
  typeof value === "string" && value ? value : new Date().toISOString();

const asCurrency = (value: unknown): AppSettings["currency"] => {
  if (value === "USD" || value === "EUR" || value === "GBP" || value === "CAD") {
    return value;
  }

  return "USD";
};

const normalizeSession = (item: unknown, index: number): SessionRecord | null => {
  if (!item || typeof item !== "object") return null;
  const raw = item as Record<string, unknown>;
  const totalInvested = toNumber(raw.totalInvested ?? raw.invested);
  const cashout = toNumber(raw.cashout);
  const profitLoss =
    raw.profitLoss !== undefined ? toNumber(raw.profitLoss) : cashout - totalInvested;

  return {
    id: typeof raw.id === "string" ? raw.id : `session-import-${index}`,
    date: typeof raw.date === "string" ? raw.date : new Date().toISOString().slice(0, 10),
    gameType:
      raw.gameType === "Spins" ||
      raw.gameType === "MTT" ||
      raw.gameType === "Cash" ||
      raw.gameType === "Other"
        ? raw.gameType
        : "Other",
    stake: typeof raw.stake === "string" ? raw.stake : String(raw.stake ?? ""),
    buyIn: clampNumber(toNumber(raw.buyIn)),
    entries: Math.max(1, Math.round(toNumber(raw.entries ?? 1))),
    totalInvested: clampNumber(totalInvested),
    cashout: clampNumber(cashout),
    profitLoss,
    durationMinutes:
      raw.durationMinutes === undefined ? undefined : Math.max(0, Math.round(toNumber(raw.durationMinutes))),
    notes: typeof raw.notes === "string" ? raw.notes : "",
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((tag): tag is string => typeof tag === "string")
      : typeof raw.tags === "string"
        ? parseTags(raw.tags)
        : [],
    createdAt: asDate(raw.createdAt),
    updatedAt: asDate(raw.updatedAt),
  };
};

const normalizeWithdrawal = (item: unknown, index: number): WithdrawalRecord | null => {
  if (!item || typeof item !== "object") return null;
  const raw = item as Record<string, unknown>;

  return {
    id: typeof raw.id === "string" ? raw.id : `withdrawal-import-${index}`,
    date: typeof raw.date === "string" ? raw.date : new Date().toISOString().slice(0, 10),
    amount: clampNumber(toNumber(raw.amount)),
    note: typeof raw.note === "string" ? raw.note : typeof raw.notes === "string" ? raw.notes : "",
    createdAt: asDate(raw.createdAt),
    updatedAt: asDate(raw.updatedAt),
  };
};

const normalizeDeposit = (item: unknown, index: number): DepositRecord | null => {
  if (!item || typeof item !== "object") return null;
  const raw = item as Record<string, unknown>;

  return {
    id: typeof raw.id === "string" ? raw.id : `deposit-import-${index}`,
    date: typeof raw.date === "string" ? raw.date : new Date().toISOString().slice(0, 10),
    amount: clampNumber(toNumber(raw.amount)),
    note: typeof raw.note === "string" ? raw.note : typeof raw.notes === "string" ? raw.notes : "",
    createdAt: asDate(raw.createdAt),
    updatedAt: asDate(raw.updatedAt),
  };
};

export function parseImportedState(json: string): AppState {
  const raw = JSON.parse(json) as Partial<AppState> & {
    settings?: Partial<AppSettings>;
  };
  const fallback = createSeedAppState();

  return {
    settings: {
      startingBankroll: clampNumber(toNumber(raw.settings?.startingBankroll), 0),
      currency: asCurrency(raw.settings?.currency),
      rules: {
        stopLossAmount: clampNumber(toNumber(raw.settings?.rules?.stopLossAmount ?? fallback.settings.rules.stopLossAmount)),
        withdrawalTriggerAmount: clampNumber(
          toNumber(raw.settings?.rules?.withdrawalTriggerAmount ?? fallback.settings.rules.withdrawalTriggerAmount),
        ),
        withdrawalAmount: clampNumber(
          toNumber(raw.settings?.rules?.withdrawalAmount ?? fallback.settings.rules.withdrawalAmount),
        ),
        minimumBankrollFloor: clampNumber(
          toNumber(raw.settings?.rules?.minimumBankrollFloor ?? fallback.settings.rules.minimumBankrollFloor),
        ),
      },
    },
    sessions: Array.isArray(raw.sessions)
      ? raw.sessions
          .map((item, index) => normalizeSession(item, index))
          .filter((item): item is SessionRecord => item !== null)
      : fallback.sessions,
    withdrawals: Array.isArray(raw.withdrawals)
      ? raw.withdrawals
          .map((item, index) => normalizeWithdrawal(item, index))
          .filter((item): item is WithdrawalRecord => item !== null)
      : fallback.withdrawals,
    deposits: Array.isArray(raw.deposits)
      ? raw.deposits
          .map((item, index) => normalizeDeposit(item, index))
          .filter((item): item is DepositRecord => item !== null)
      : fallback.deposits,
    customTags: Array.isArray(raw.customTags)
      ? raw.customTags.filter((tag): tag is string => typeof tag === "string")
      : fallback.customTags,
    updatedAt: asDate(raw.updatedAt),
  };
}

export function sessionInputToRecord(
  input: SessionInput,
  id: string,
  createdAt: string,
  updatedAt: string,
): SessionRecord {
  return {
    ...input,
    id,
    createdAt,
    updatedAt,
    profitLoss: Number((input.cashout - input.totalInvested).toFixed(2)),
  };
}
