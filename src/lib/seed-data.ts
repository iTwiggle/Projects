import {
  AppState,
  AppSettings,
  DEFAULT_TAGS,
  GAME_TYPES,
  type SessionTag,
} from "@/lib/types";

export const STORAGE_KEY = "bankroll-sidekick-state";
export const SESSION_TAG_SUGGESTIONS = [...DEFAULT_TAGS] satisfies readonly SessionTag[];
export { GAME_TYPES };

const now = new Date();

const isoDay = (daysAgo = 0) => {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
};

const isoTimestamp = (daysAgo = 0) => {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

export const DEFAULT_SETTINGS: AppSettings = {
  startingBankroll: 500,
  currency: "USD",
  rules: {
    stopLossAmount: 125,
    withdrawalTriggerAmount: 150,
    withdrawalAmount: 100,
    minimumBankrollFloor: 350,
  },
};

export const DEFAULT_APP_STATE: AppState = {
  settings: DEFAULT_SETTINGS,
  sessions: [
    {
      id: "session-1",
      date: isoDay(18),
      gameType: "Spins",
      stake: "$10 Spin",
      buyIn: 10,
      entries: 3,
      totalInvested: 30,
      cashout: 48,
      profitLoss: 18,
      durationMinutes: 70,
      notes: "Stayed patient and quit after the games turned thin.",
      tags: ["played well", "good quit"],
      createdAt: isoTimestamp(18),
      updatedAt: isoTimestamp(18),
    },
    {
      id: "session-2",
      date: isoDay(14),
      gameType: "MTT",
      stake: "$22 MTT",
      buyIn: 22,
      entries: 2,
      totalInvested: 44,
      cashout: 0,
      profitLoss: -44,
      durationMinutes: 155,
      notes: "Two impatient spots early. Marked a few hands to review.",
      tags: ["tilt", "bad call"],
      createdAt: isoTimestamp(14),
      updatedAt: isoTimestamp(14),
    },
    {
      id: "session-3",
      date: isoDay(10),
      gameType: "Cash",
      stake: "1/3 NLH",
      buyIn: 80,
      entries: 1,
      totalInvested: 80,
      cashout: 196,
      profitLoss: 116,
      durationMinutes: 195,
      notes: "Good table selection and value-heavy lines all session.",
      tags: ["played well"],
      createdAt: isoTimestamp(10),
      updatedAt: isoTimestamp(10),
    },
    {
      id: "session-4",
      date: isoDay(6),
      gameType: "Spins",
      stake: "$25 Spin",
      buyIn: 25,
      entries: 4,
      totalInvested: 100,
      cashout: 60,
      profitLoss: -40,
      durationMinutes: 95,
      notes: "Shot took a touch high, but quit on time.",
      tags: ["shot take", "good quit"],
      createdAt: isoTimestamp(6),
      updatedAt: isoTimestamp(6),
    },
    {
      id: "session-5",
      date: isoDay(2),
      gameType: "MTT",
      stake: "$11 MTT",
      buyIn: 11,
      entries: 3,
      totalInvested: 33,
      cashout: 121,
      profitLoss: 88,
      durationMinutes: 205,
      notes: "Clean register discipline and a deep run without punting late.",
      tags: ["played well"],
      createdAt: isoTimestamp(2),
      updatedAt: isoTimestamp(2),
    },
  ],
  withdrawals: [
    {
      id: "withdrawal-1",
      date: isoDay(4),
      amount: 100,
      note: "Moved one trigger payout out of the roll.",
      createdAt: isoTimestamp(4),
      updatedAt: isoTimestamp(4),
    },
  ],
  deposits: [
    {
      id: "deposit-1",
      date: isoDay(25),
      amount: 75,
      note: "Small reload added after resetting the tracker.",
      createdAt: isoTimestamp(25),
      updatedAt: isoTimestamp(25),
    },
  ],
  customTags: [],
  updatedAt: now.toISOString(),
};

export const seedAppState = DEFAULT_APP_STATE;

export function createSeedAppState(): AppState {
  return JSON.parse(JSON.stringify(DEFAULT_APP_STATE)) as AppState;
}
