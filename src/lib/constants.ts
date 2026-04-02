import type { AppData, GameType } from "@/lib/types"

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
