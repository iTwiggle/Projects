export type GameType = "Spins" | "MTT" | "Cash" | "Other";

export interface Session {
  id: string;
  date: string;
  gameType: GameType;
  buyIn: number;
  entries: number;
  totalInvested: number;
  cashout: number;
  profitLoss: number;
  notes: string;
  durationMinutes?: number;
  tags: string[];
}

export interface Withdrawal {
  id: string;
  date: string;
  amount: number;
  note: string;
}

export interface Deposit {
  id: string;
  date: string;
  amount: number;
  note: string;
}

export interface BankrollRules {
  stopLossAmount: number;
  withdrawalTriggerAmount: number;
  withdrawalAmount: number;
  minBankrollFloor: number;
}

export interface AppSettings {
  startingBankroll: number;
  currency: string;
  rules: BankrollRules;
}

export interface AppData {
  settings: AppSettings;
  sessions: Session[];
  withdrawals: Withdrawal[];
  deposits: Deposit[];
}

export type RangeFilter = "7d" | "30d" | "all";

export type RuleStatus =
  | "safe-to-play"
  | "approaching-stop-loss"
  | "withdrawal-available"
  | "below-bankroll-floor";

export interface RuleEvaluation {
  status: RuleStatus;
  effectiveBaseline: number;
  stopLossLine: number;
  triggerLine: number;
  cyclesCompleted: number;
  suggestedWithdrawalCount: number;
  suggestedWithdrawalValue: number;
  explanation: string;
}
