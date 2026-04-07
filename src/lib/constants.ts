import type { AppData, BankrollRules, GameType } from "@/lib/types"

export const STORAGE_KEY = "bankroll-sidekick-v1"

export const GAME_TYPES: GameType[] = ["Spins", "MTT", "Cash", "Other"]

export const DEFAULT_TAGS = [
  "tilt",
  "played well",
  "bad call",
  "good quit",
  "shot take",
]

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"]

export interface RulePreset {
  id: "spins" | "mtt" | "cash"
  label: string
  description: string
  startingBankroll: number
  rules: BankrollRules
}

export const RULE_PRESETS: RulePreset[] = [
  {
    id: "spins",
    label: "Spins preset",
    description: "Higher volume with tighter stop-loss control.",
    startingBankroll: 500,
    rules: {
      stopLossAmount: 120,
      withdrawalTriggerAmount: 150,
      withdrawalAmount: 100,
      minBankrollFloor: 250,
    },
  },
  {
    id: "mtt",
    label: "MTT preset",
    description: "Larger variance buffer and slower withdrawal cadence.",
    startingBankroll: 1200,
    rules: {
      stopLossAmount: 280,
      withdrawalTriggerAmount: 350,
      withdrawalAmount: 200,
      minBankrollFloor: 700,
    },
  },
  {
    id: "cash",
    label: "Cash preset",
    description: "Moderate variance profile for steady sessions.",
    startingBankroll: 900,
    rules: {
      stopLossAmount: 180,
      withdrawalTriggerAmount: 240,
      withdrawalAmount: 150,
      minBankrollFloor: 550,
    },
  },
]

export const DEFAULT_APP_DATA: AppData = {
  settings: {
    startingBankroll: 500,
    currency: "USD",
    rules: {
      stopLossAmount: 120,
      withdrawalTriggerAmount: 150,
      withdrawalAmount: 100,
      minBankrollFloor: 250,
    },
  },
  sessions: [],
  withdrawals: [],
  deposits: [],
}

export function createDefaultAppData(): AppData {
  return {
    settings: {
      startingBankroll: DEFAULT_APP_DATA.settings.startingBankroll,
      currency: DEFAULT_APP_DATA.settings.currency,
      rules: {
        ...DEFAULT_APP_DATA.settings.rules,
      },
    },
    sessions: [],
    withdrawals: [],
    deposits: [],
  }
}
