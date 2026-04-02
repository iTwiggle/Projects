export const GAME_TYPES = ["Spins", "MTT", "Cash", "Other"] as const;
export const DEFAULT_TAGS = [
  "tilt",
  "played well",
  "bad call",
  "good quit",
  "shot take",
] as const;
export const CURRENCIES = ["USD", "EUR", "GBP", "CAD"] as const;

export type GameType = (typeof GAME_TYPES)[number];
export type SessionTag = string;
export type CurrencyCode = (typeof CURRENCIES)[number];
export type RangeFilter = "7d" | "30d" | "all";

export interface BankrollRules {
  stopLossAmount: number;
  withdrawalTriggerAmount: number;
  withdrawalAmount: number;
  minimumBankrollFloor: number;
}

export interface AppSettings {
  startingBankroll: number;
  currency: CurrencyCode;
  rules: BankrollRules;
}

export interface SessionRecord {
  id: string;
  date: string;
  gameType: GameType;
  stake: string;
  buyIn: number;
  entries: number;
  totalInvested: number;
  cashout: number;
  profitLoss: number;
  durationMinutes?: number;
  notes: string;
  tags: SessionTag[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionInput {
  date: string;
  gameType: GameType;
  stake: string;
  buyIn: number;
  entries: number;
  totalInvested: number;
  cashout: number;
  durationMinutes?: number;
  notes: string;
  tags: SessionTag[];
}

export interface WithdrawalRecord {
  id: string;
  date: string;
  amount: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalInput {
  date: string;
  amount: number;
  note: string;
}

export interface DepositRecord {
  id: string;
  date: string;
  amount: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  settings: AppSettings;
  sessions: SessionRecord[];
  withdrawals: WithdrawalRecord[];
  deposits: DepositRecord[];
  customTags: string[];
  updatedAt: string;
}

export interface SessionFilter {
  range: RangeFilter;
  gameType: GameType | "all";
  tag: SessionTag | "all";
}

export interface BankrollSummary {
  currentBankroll: number;
  totalProfitLoss: number;
  totalWithdrawals: number;
  totalDeposits: number;
  securedOutsideBankroll: number;
  effectiveBaseline: number;
  nextWithdrawalTarget: number;
  remainingToWithdrawal: number;
  stopLossLine: number;
  remainingStopLoss: number;
  suggestedWithdrawal: number;
  tierLabel: string;
  status:
    | "safe to play"
    | "approaching stop-loss"
    | "withdrawal available"
    | "below bankroll floor";
  statusExplanation: string;
}

export interface AnalyticsSnapshot {
  winRate: number;
  averageBuyIn: number;
  averageSessionResult: number;
  biggestWin: number;
  biggestLoss: number;
  longestUpswing: number;
  longestDownswing: number;
  bestGameType: GameType | "No data";
  recentSessions: SessionRecord[];
  bankrollChart: Array<{
    date: string;
    bankroll: number;
    change: number;
    label: string;
  }>;
  profitByGameType: Array<{
    gameType: GameType;
    profit: number;
  }>;
  withdrawalChart: Array<{
    date: string;
    withdrawn: number;
    totalWithdrawn: number;
  }>;
}
