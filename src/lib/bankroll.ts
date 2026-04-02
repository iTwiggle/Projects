import type {
  AnalyticsSnapshot,
  AppSettings,
  AppState,
  BankrollSummary,
  CurrencyCode,
  DepositRecord,
  GameType,
  RangeFilter,
  SessionFilter,
  SessionInput,
  SessionRecord,
  WithdrawalRecord,
} from "@/lib/types";

const DAY_MS = 1000 * 60 * 60 * 24;

const sortByDateAsc = <T extends { date: string }>(items: T[]) =>
  [...items].sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
  );

const getRangeStart = (range: RangeFilter) => {
  if (range === "all") return undefined;

  const days = range === "7d" ? 7 : 30;
  return new Date(Date.now() - days * DAY_MS);
};

export function roundCurrency(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function sanitizeCurrencyInput(value: string | number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? roundCurrency(parsed) : 0;
}

export function formatCurrency(
  value: number,
  currency: CurrencyCode | string,
  maximumFractionDigits = 2,
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateLabel(date: string) {
  if (date === "Start") return date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function calculateSessionProfit(
  investedOrSession: number | Pick<SessionRecord, "totalInvested" | "cashout">,
  cashout?: number,
) {
  if (typeof investedOrSession === "number") {
    return roundCurrency(
      sanitizeCurrencyInput(cashout ?? 0) -
        sanitizeCurrencyInput(investedOrSession),
    );
  }

  return roundCurrency(investedOrSession.cashout - investedOrSession.totalInvested);
}

export function calculateInvested(buyIn: number, entries: number) {
  return roundCurrency(sanitizeCurrencyInput(buyIn) * Math.max(1, Math.floor(entries || 1)));
}

export function normalizeSessionInput(input: SessionInput): SessionInput & {
  profitLoss: number;
} {
  const buyIn = sanitizeCurrencyInput(input.buyIn);
  const entries = Math.max(1, Math.floor(input.entries || 1));
  const totalInvested =
    sanitizeCurrencyInput(input.totalInvested) || calculateInvested(buyIn, entries);
  const cashout = sanitizeCurrencyInput(input.cashout);

  return {
    ...input,
    buyIn,
    entries,
    totalInvested,
    cashout,
    durationMinutes: input.durationMinutes
      ? Math.max(0, Math.floor(input.durationMinutes))
      : undefined,
    notes: input.notes.trim(),
    tags: Array.from(
      new Set(
        input.tags
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      ),
    ),
    profitLoss: calculateSessionProfit(totalInvested, cashout),
  };
}

export function sumSessionProfit(sessions: SessionRecord[]) {
  return roundCurrency(
    sessions.reduce((total, session) => total + session.profitLoss, 0),
  );
}

export function sumWithdrawals(withdrawals: WithdrawalRecord[]) {
  return roundCurrency(
    withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0),
  );
}

export function sumDeposits(deposits: DepositRecord[]) {
  return roundCurrency(deposits.reduce((total, deposit) => total + deposit.amount, 0));
}

export function getFilteredSessions(
  sessions: SessionRecord[],
  filter: SessionFilter,
) {
  const startDate = getRangeStart(filter.range);

  return sortByDateAsc(sessions).filter((session) => {
    const matchesGameType =
      filter.gameType === "all" || session.gameType === filter.gameType;
    const matchesTag = filter.tag === "all" || session.tags.includes(filter.tag);
    const matchesDate =
      !startDate || new Date(session.date).getTime() >= startDate.getTime();

    return matchesGameType && matchesTag && matchesDate;
  });
}

function getTierLabel(currentBankroll: number, floor: number) {
  const distance = currentBankroll - floor;

  if (distance <= 0) return "At risk";
  if (distance <= 100) return "Cautious";
  if (distance <= 300) return "Stable";
  if (distance <= 700) return "Growing";
  return "Locked in";
}

export function computeBankrollSummary(
  settings: AppSettings,
  sessions: SessionRecord[],
  withdrawals: WithdrawalRecord[],
  deposits: DepositRecord[] = [],
): BankrollSummary {
  const totalProfitLoss = sumSessionProfit(sessions);
  const totalWithdrawals = sumWithdrawals(withdrawals);
  const totalDeposits = sumDeposits(deposits);
  const currentBankroll = roundCurrency(
    settings.startingBankroll + totalDeposits - totalWithdrawals + totalProfitLoss,
  );

  const withdrawalCycles =
    settings.rules.withdrawalAmount > 0
      ? totalWithdrawals / settings.rules.withdrawalAmount
      : 0;
  const retainedPerCycle =
    settings.rules.withdrawalTriggerAmount - settings.rules.withdrawalAmount;
  const effectiveBaseline = roundCurrency(
    settings.startingBankroll + withdrawalCycles * retainedPerCycle,
  );

  const nextWithdrawalTarget = roundCurrency(
    effectiveBaseline + settings.rules.withdrawalTriggerAmount,
  );
  const remainingToWithdrawal = roundCurrency(
    Math.max(0, nextWithdrawalTarget - currentBankroll),
  );
  const stopLossLine = roundCurrency(
    Math.max(
      settings.rules.minimumBankrollFloor,
      effectiveBaseline - settings.rules.stopLossAmount,
    ),
  );
  const remainingStopLoss = roundCurrency(
    Math.max(0, currentBankroll - stopLossLine),
  );
  const withdrawalAvailable =
    currentBankroll >= nextWithdrawalTarget &&
    currentBankroll - settings.rules.withdrawalAmount >=
      settings.rules.minimumBankrollFloor;
  const approachingThreshold = roundCurrency(
    stopLossLine + Math.max(25, settings.rules.stopLossAmount * 0.2),
  );

  let status: BankrollSummary["status"] = "safe to play";
  let statusExplanation =
    "Your bankroll is above the floor and not close to the current stop-loss zone.";

  if (currentBankroll < settings.rules.minimumBankrollFloor) {
    status = "below bankroll floor";
    statusExplanation =
      "The active bankroll is below your minimum floor. Pause or reload before continuing normal volume.";
  } else if (withdrawalAvailable) {
    status = "withdrawal available";
    statusExplanation =
      "You are above the current trigger. A withdrawal can be logged now without dropping below the bankroll floor.";
  } else if (currentBankroll <= approachingThreshold) {
    status = "approaching stop-loss";
    statusExplanation =
      "The bankroll is getting close to the current stop-loss line. Consider ending the session, dropping stakes, or tightening volume.";
  }

  return {
    currentBankroll,
    totalProfitLoss,
    totalWithdrawals,
    totalDeposits,
    securedOutsideBankroll: totalWithdrawals,
    effectiveBaseline,
    nextWithdrawalTarget,
    remainingToWithdrawal,
    stopLossLine,
    remainingStopLoss,
    suggestedWithdrawal: withdrawalAvailable ? settings.rules.withdrawalAmount : 0,
    tierLabel: getTierLabel(currentBankroll, settings.rules.minimumBankrollFloor),
    status,
    statusExplanation,
  };
}

export function calculateBankrollState(
  settings: AppSettings,
  sessions: SessionRecord[],
  withdrawals: WithdrawalRecord[],
  deposits: DepositRecord[] = [],
) {
  return computeBankrollSummary(settings, sessions, withdrawals, deposits);
}

function getLongestDirectionalRun(
  sessions: SessionRecord[],
  direction: "up" | "down",
) {
  let best = 0;
  let current = 0;

  sortByDateAsc(sessions).forEach((session) => {
    const matches =
      direction === "up" ? session.profitLoss > 0 : session.profitLoss < 0;
    current = matches ? current + 1 : 0;
    best = Math.max(best, current);
  });

  return best;
}

function getProfitByGameType(sessions: SessionRecord[]) {
  const totals = new Map<GameType, number>();

  sessions.forEach((session) => {
    totals.set(
      session.gameType,
      roundCurrency((totals.get(session.gameType) || 0) + session.profitLoss),
    );
  });

  return Array.from(totals.entries()).map(([gameType, profit]) => ({
    gameType,
    profit,
  }));
}

function getBankrollChart(state: AppState) {
  const events = [
    ...state.deposits.map((deposit) => ({
      date: deposit.date,
      amount: deposit.amount,
      label: deposit.note || "Deposit",
    })),
    ...state.sessions.map((session) => ({
      date: session.date,
      amount: session.profitLoss,
      label: session.gameType,
    })),
    ...state.withdrawals.map((withdrawal) => ({
      date: withdrawal.date,
      amount: -withdrawal.amount,
      label: withdrawal.note || "Withdrawal",
    })),
  ].sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());

  let running = state.settings.startingBankroll;

  return [
    {
      date: "Start",
      bankroll: roundCurrency(running),
      change: 0,
      label: "Starting bankroll",
    },
    ...events.map((event) => {
      running = roundCurrency(running + event.amount);
      return {
        date: event.date,
        bankroll: running,
        change: roundCurrency(event.amount),
        label: event.label,
      };
    }),
  ];
}

function getWithdrawalChart(withdrawals: WithdrawalRecord[]) {
  let running = 0;

  return sortByDateAsc(withdrawals).map((withdrawal) => {
    running = roundCurrency(running + withdrawal.amount);

    return {
      date: withdrawal.date,
      withdrawn: withdrawal.amount,
      totalWithdrawn: running,
    };
  });
}

function getBestGameType(sessions: SessionRecord[]) {
  const byType = getProfitByGameType(sessions);
  if (!byType.length) return "No data" as const;

  return byType.reduce((best, current) =>
    current.profit > best.profit ? current : best,
  ).gameType;
}

export function calculateAnalytics(state: AppState): AnalyticsSnapshot {
  const sessions = sortByDateAsc(state.sessions);
  const wins = sessions.filter((session) => session.profitLoss > 0).length;
  const averageBuyIn =
    sessions.length > 0
      ? roundCurrency(
          sessions.reduce((total, session) => total + session.buyIn, 0) /
            sessions.length,
        )
      : 0;
  const averageSessionResult =
    sessions.length > 0 ? roundCurrency(sumSessionProfit(sessions) / sessions.length) : 0;
  const biggestWin = sessions.reduce(
    (best, session) => Math.max(best, session.profitLoss),
    0,
  );
  const biggestLoss = sessions.reduce(
    (worst, session) => Math.min(worst, session.profitLoss),
    0,
  );

  return {
    winRate: sessions.length ? roundCurrency((wins / sessions.length) * 100) : 0,
    averageBuyIn,
    averageSessionResult,
    biggestWin,
    biggestLoss,
    longestUpswing: getLongestDirectionalRun(sessions, "up"),
    longestDownswing: getLongestDirectionalRun(sessions, "down"),
    bestGameType: getBestGameType(sessions),
    recentSessions: [...sessions].reverse().slice(0, 4),
    bankrollChart: getBankrollChart(state),
    profitByGameType: getProfitByGameType(sessions),
    withdrawalChart: getWithdrawalChart(state.withdrawals),
  };
}
