import { GAME_TYPES } from "@/lib/constants";
import type {
  AppData,
  GameType,
  RangeFilter,
  RuleEvaluation,
  Session,
  Withdrawal,
} from "@/lib/types";

export interface FilterOptions {
  gameType: GameType | "All";
  tag: string | "All";
  range: RangeFilter;
}

export interface SessionTypeSummary {
  gameType: GameType;
  totalProfitLoss: number;
  sessions: number;
  averageResult: number;
  winRate: number;
}

export interface TotalsSummary {
  bankroll: number;
  totalProfitLoss: number;
  totalWithdrawals: number;
  totalDeposits: number;
  sessionWinRate: number;
  averageBuyIn: number;
  averageSessionResult: number;
  biggestWin: number;
  biggestLoss: number;
}

export interface TierSummary {
  label: string;
  note: string;
}

export interface StreakSummary {
  longestUpswing: number;
  longestDownswing: number;
  currentDirection: "up" | "down" | "flat";
  currentLength: number;
}

export interface TodaySummary {
  sessions: number;
  profitLoss: number;
}

export interface TimelinePoint {
  date: string;
  bankroll: number;
  profitLoss: number;
  withdrawals: number;
  deposits: number;
}

export interface WithdrawalTimelinePoint {
  date: string;
  withdrawal: number;
  cumulative: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export function clampMin(value: number, min = 0): number {
  return value < min ? min : value;
}

export function buildSession(values: {
  id: string;
  date: string;
  gameType: GameType;
  buyIn: number;
  entries: number;
  totalInvested: number;
  cashout: number;
  notes: string;
  durationMinutes?: number;
  tags: string[];
}): Session {
  const buyIn = round2(clampMin(values.buyIn, 0));
  const entries = Math.max(1, Math.floor(toNumber(values.entries, 1)));
  const investedInput = clampMin(values.totalInvested, 0);
  const invested = round2(investedInput > 0 ? investedInput : buyIn * entries);
  const cashout = round2(clampMin(values.cashout, 0));

  return {
    id: values.id,
    date: values.date,
    gameType: values.gameType,
    buyIn,
    entries,
    totalInvested: invested,
    cashout,
    profitLoss: round2(cashout - invested),
    notes: values.notes.trim(),
    durationMinutes:
      values.durationMinutes && values.durationMinutes > 0
        ? Math.floor(values.durationMinutes)
        : undefined,
    tags: values.tags,
  };
}

function parseDateOnly(value: string): number {
  return new Date(`${value}T00:00:00`).getTime();
}

function isInRange(date: string, range: RangeFilter): boolean {
  if (range === "all") {
    return true;
  }

  const days = range === "7d" ? 7 : 30;
  const now = Date.now();
  const target = parseDateOnly(date);
  const diff = now - target;
  return diff >= 0 && diff <= days * DAY_MS;
}

export function sortByDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => parseDateOnly(b.date) - parseDateOnly(a.date));
}

function sortByDateAsc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => parseDateOnly(a.date) - parseDateOnly(b.date));
}

export function filterSessions(
  sessions: Session[],
  filters: FilterOptions
): Session[] {
  return sortByDateDesc(
    sessions.filter((session) => {
      if (filters.gameType !== "All" && session.gameType !== filters.gameType) {
        return false;
      }

      if (filters.tag !== "All" && !session.tags.includes(filters.tag)) {
        return false;
      }

      return isInRange(session.date, filters.range);
    })
  );
}

export function getAllTags(sessions: Session[]): string[] {
  const unique = new Set<string>();
  for (const session of sessions) {
    for (const tag of session.tags) {
      if (tag.trim()) {
        unique.add(tag.trim());
      }
    }
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

export function calculateTotals(data: AppData): TotalsSummary {
  const totalProfitLoss = round2(
    data.sessions.reduce((sum, session) => sum + session.profitLoss, 0)
  );
  const totalWithdrawals = round2(
    data.withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0)
  );
  const totalDeposits = round2(
    data.deposits.reduce((sum, deposit) => sum + deposit.amount, 0)
  );

  const bankroll = round2(
    data.settings.startingBankroll +
      totalDeposits -
      totalWithdrawals +
      totalProfitLoss
  );

  const wins = data.sessions.filter((session) => session.profitLoss > 0).length;
  const sessionWinRate = data.sessions.length
    ? round2((wins / data.sessions.length) * 100)
    : 0;
  const averageBuyIn = data.sessions.length
    ? round2(
        data.sessions.reduce((sum, session) => sum + session.buyIn, 0) /
          data.sessions.length
      )
    : 0;
  const averageSessionResult = data.sessions.length
    ? round2(totalProfitLoss / data.sessions.length)
    : 0;

  const biggestWin = data.sessions.length
    ? Math.max(...data.sessions.map((session) => session.profitLoss))
    : 0;
  const biggestLoss = data.sessions.length
    ? Math.min(...data.sessions.map((session) => session.profitLoss))
    : 0;

  return {
    bankroll,
    totalProfitLoss,
    totalWithdrawals,
    totalDeposits,
    sessionWinRate,
    averageBuyIn,
    averageSessionResult,
    biggestWin: round2(biggestWin),
    biggestLoss: round2(biggestLoss),
  };
}

export function getBankrollTier(
  bankroll: number,
  baseline: number,
  minFloor: number,
  trigger: number
): TierSummary {
  if (bankroll < minFloor) {
    return {
      label: "Critical",
      note: "Below floor. Step down or pause.",
    };
  }

  if (bankroll < baseline) {
    return {
      label: "Recovery",
      note: "Rebuilding back to baseline.",
    };
  }

  if (bankroll < baseline + trigger) {
    return {
      label: "Stable",
      note: "In-range and protected.",
    };
  }

  if (bankroll < baseline + trigger * 2) {
    return {
      label: "Growth",
      note: "Withdrawals are becoming available.",
    };
  }

  return {
    label: "Momentum",
    note: "Bankroll is running above target pace.",
  };
}

export function evaluateRules(data: AppData, bankroll: number): RuleEvaluation {
  const { rules, startingBankroll } = data.settings;
  const totalWithdrawals = data.withdrawals.reduce(
    (sum, withdrawal) => sum + withdrawal.amount,
    0
  );

  const cyclesCompleted =
    rules.withdrawalAmount > 0
      ? Math.floor(totalWithdrawals / rules.withdrawalAmount)
      : 0;
  const effectiveBaseline = round2(
    startingBankroll + cyclesCompleted * rules.withdrawalAmount
  );
  const stopLossLine = round2(effectiveBaseline - rules.stopLossAmount);
  const triggerLine = round2(effectiveBaseline + rules.withdrawalTriggerAmount);

  let suggestedWithdrawalCount = 0;
  let simulatedBankroll = bankroll;
  let simulatedBaseline = effectiveBaseline;

  if (rules.withdrawalAmount > 0 && rules.withdrawalTriggerAmount > 0) {
    while (
      suggestedWithdrawalCount < 30 &&
      simulatedBankroll >= simulatedBaseline + rules.withdrawalTriggerAmount
    ) {
      suggestedWithdrawalCount += 1;
      simulatedBankroll -= rules.withdrawalAmount;
      simulatedBaseline += rules.withdrawalAmount;
    }
  }

  const suggestedWithdrawalValue = round2(
    suggestedWithdrawalCount * rules.withdrawalAmount
  );
  const stopLossBuffer = rules.stopLossAmount * 0.2;

  let status: RuleEvaluation["status"] = "safe-to-play";

  if (bankroll < rules.minBankrollFloor) {
    status = "below-bankroll-floor";
  } else if (suggestedWithdrawalCount > 0) {
    status = "withdrawal-available";
  } else if (bankroll <= stopLossLine + stopLossBuffer) {
    status = "approaching-stop-loss";
  }

  const explanationByStatus: Record<RuleEvaluation["status"], string> = {
    "safe-to-play":
      "Bankroll is above floor and away from stop-loss. Continue current stakes with discipline.",
    "approaching-stop-loss":
      "You are close to the stop-loss line for the current baseline. Consider reducing volume or stepping down.",
    "withdrawal-available":
      "Your bankroll has crossed the withdrawal trigger. Securing profit now keeps risk controlled as baseline climbs.",
    "below-bankroll-floor":
      "Bankroll is below your minimum floor. Pause, rebuild, or move to lower stakes before continuing.",
  };

  return {
    status,
    effectiveBaseline,
    stopLossLine,
    triggerLine,
    cyclesCompleted,
    suggestedWithdrawalCount,
    suggestedWithdrawalValue,
    explanation: explanationByStatus[status],
  };
}

export function getSessionTypeSummary(
  sessions: Session[],
  range: RangeFilter
): SessionTypeSummary[] {
  const scoped = sessions.filter((session) => isInRange(session.date, range));
  const map = new Map<GameType, Session[]>();

  for (const type of GAME_TYPES) {
    map.set(type, []);
  }

  for (const session of scoped) {
    const existing = map.get(session.gameType) ?? [];
    existing.push(session);
    map.set(session.gameType, existing);
  }

  return GAME_TYPES.map((gameType) => {
    const items = map.get(gameType) ?? [];
    const totalProfitLoss = round2(
      items.reduce((sum, session) => sum + session.profitLoss, 0)
    );
    const sessionsCount = items.length;
    const wins = items.filter((session) => session.profitLoss > 0).length;

    return {
      gameType,
      totalProfitLoss,
      sessions: sessionsCount,
      averageResult: sessionsCount ? round2(totalProfitLoss / sessionsCount) : 0,
      winRate: sessionsCount ? round2((wins / sessionsCount) * 100) : 0,
    };
  });
}

export function getBestGameType(
  summaries: SessionTypeSummary[]
): SessionTypeSummary | null {
  const withVolume = summaries.filter((summary) => summary.sessions > 0);
  if (!withVolume.length) {
    return null;
  }

  return [...withVolume].sort((a, b) => b.averageResult - a.averageResult)[0];
}

export function getBankrollTimeline(data: AppData): TimelinePoint[] {
  const perDay = new Map<
    string,
    { profitLoss: number; withdrawals: number; deposits: number }
  >();

  for (const session of data.sessions) {
    const record = perDay.get(session.date) ?? {
      profitLoss: 0,
      withdrawals: 0,
      deposits: 0,
    };
    record.profitLoss += session.profitLoss;
    perDay.set(session.date, record);
  }

  for (const withdrawal of data.withdrawals) {
    const record = perDay.get(withdrawal.date) ?? {
      profitLoss: 0,
      withdrawals: 0,
      deposits: 0,
    };
    record.withdrawals += withdrawal.amount;
    perDay.set(withdrawal.date, record);
  }

  for (const deposit of data.deposits) {
    const record = perDay.get(deposit.date) ?? {
      profitLoss: 0,
      withdrawals: 0,
      deposits: 0,
    };
    record.deposits += deposit.amount;
    perDay.set(deposit.date, record);
  }

  const dates = [...perDay.keys()].sort(
    (a, b) => parseDateOnly(a) - parseDateOnly(b)
  );
  if (!dates.length) {
    const today = new Date().toISOString().slice(0, 10);
    return [
      {
        date: today,
        bankroll: round2(data.settings.startingBankroll),
        profitLoss: 0,
        withdrawals: 0,
        deposits: 0,
      },
    ];
  }

  let running = data.settings.startingBankroll;
  const points: TimelinePoint[] = [];

  for (const date of dates) {
    const daily = perDay.get(date);
    if (!daily) {
      continue;
    }
    running += daily.profitLoss + daily.deposits - daily.withdrawals;
    points.push({
      date,
      bankroll: round2(running),
      profitLoss: round2(daily.profitLoss),
      withdrawals: round2(daily.withdrawals),
      deposits: round2(daily.deposits),
    });
  }

  return points;
}

export function getWithdrawalTimeline(withdrawals: Withdrawal[]) {
  const sorted = sortByDateAsc(withdrawals);
  let running = 0;
  const result: WithdrawalTimelinePoint[] = [];

  for (const withdrawal of sorted) {
    running += withdrawal.amount;
    result.push({
      date: withdrawal.date,
      withdrawal: round2(withdrawal.amount),
      cumulative: round2(running),
    });
  }

  return result;
}

export function getStreakSummary(sessions: Session[]): StreakSummary {
  const sorted = sortByDateAsc(sessions);
  let longestUpswing = 0;
  let longestDownswing = 0;

  let currentUp = 0;
  let currentDown = 0;

  for (const session of sorted) {
    if (session.profitLoss > 0) {
      currentUp += 1;
      currentDown = 0;
    } else if (session.profitLoss < 0) {
      currentDown += 1;
      currentUp = 0;
    } else {
      currentUp = 0;
      currentDown = 0;
    }

    longestUpswing = Math.max(longestUpswing, currentUp);
    longestDownswing = Math.max(longestDownswing, currentDown);
  }

  if (!sorted.length) {
    return {
      longestUpswing,
      longestDownswing,
      currentDirection: "flat",
      currentLength: 0,
    };
  }

  const reversed = [...sorted].reverse();
  let currentDirection: StreakSummary["currentDirection"] = "flat";
  let currentLength = 0;

  for (const session of reversed) {
    const direction: StreakSummary["currentDirection"] =
      session.profitLoss > 0 ? "up" : session.profitLoss < 0 ? "down" : "flat";

    if (currentDirection === "flat") {
      currentDirection = direction;
      currentLength = 1;
      continue;
    }

    if (direction === currentDirection) {
      currentLength += 1;
    } else {
      break;
    }
  }

  return {
    longestUpswing,
    longestDownswing,
    currentDirection,
    currentLength,
  };
}

export function getTodaySummary(sessions: Session[]): TodaySummary {
  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter((session) => session.date === today);
  return {
    sessions: todaySessions.length,
    profitLoss: round2(
      todaySessions.reduce((sum, session) => sum + session.profitLoss, 0)
    ),
  };
}
