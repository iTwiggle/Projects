import type { ProgressionState } from "@/types/task";

const HISTORY_KEY = "velvet-orders:task-history";
const HISTORY_WINDOW = 10;

type ProgressActionType = "complete" | "reroll" | "skip";

export type ProgressAction = {
  type: ProgressActionType;
  taskId?: string;
  timestamp?: number;
  proofProvided?: boolean;
};

type StoredProgressAction = {
  type: ProgressActionType;
  taskId?: string;
  timestamp: number;
  proofProvided?: boolean;
};

type ProgressionMeta = {
  completedCount: number;
  rerollCount: number;
  skipCount: number;
  proofCount: number;
  streak: number;
  total: number;
};

export type ProgressionSignals = {
  completed: number;
  rerolled: number;
  skipped: number;
  proofProvided: number;
  streak: number;
  total: number;
};

const STATUS_PHRASES: Record<ProgressionState, string[]> = {
  "warming-up": [
    "Warming up. Keep it simple and consistent.",
    "Early momentum phase. One clean task at a time.",
    "Starting steady. Build rhythm first.",
  ],
  steady: [
    "Steady pace. Keep your standards quiet and clear.",
    "Consistency is holding. Stay with the plan.",
    "You are in a stable groove. Continue cleanly.",
  ],
  "locked-in": [
    "Locked in. Precision is becoming your default.",
    "Strong control window. Keep execution crisp.",
    "Locked in and reliable. Hold this quality.",
  ],
  slipping: [
    "Slight slip detected. Reset and execute the next one cleanly.",
    "Drift is showing. Shorten decisions and follow through.",
    "Corrective mode. Fewer pivots, cleaner finishes.",
  ],
};

const COMPLETION_PHRASES: Record<ProgressionState, string[]> = {
  "warming-up": [
    "Good start. Keep stacking clean reps.",
    "Nice first step. Stay with this tempo.",
    "Solid warm-up completion.",
  ],
  steady: [
    "Strong follow-through. Stay steady.",
    "Clean completion. Keep this standard.",
    "Good execution. Continue the pattern.",
  ],
  "locked-in": [
    "Excellent control. This is locked-in work.",
    "Approved. Your consistency is sharp.",
    "High-quality finish. Maintain pressure.",
  ],
  slipping: [
    "Good correction. Repeat this standard next.",
    "Better. Keep decisions tighter now.",
    "Recovered cleanly. Hold the line.",
  ],
};

const TONE_HINTS: Record<ProgressionState, string[]> = {
  "warming-up": [
    "gentle emphasis",
    "inviting guidance",
    "low-pressure framing",
  ],
  steady: [
    "confident neutral delivery",
    "calm direct framing",
    "stable measured tone",
  ],
  "locked-in": [
    "approving evaluative edge",
    "high-standard delivery",
    "precision-forward framing",
  ],
  slipping: [
    "firm corrective framing",
    "concise reset pressure",
    "tighter accountability",
  ],
};

function hashSeed(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickFromPool(pool: string[], seed: string): string {
  const idx = hashSeed(seed) % pool.length;
  return pool[idx] ?? pool[0];
}

function readProgressHistory(): StoredProgressAction[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(HISTORY_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const sanitized: StoredProgressAction[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      const maybe = entry as Partial<StoredProgressAction>;
      if (
        maybe.type !== "complete" &&
        maybe.type !== "reroll" &&
        maybe.type !== "skip"
      ) {
        continue;
      }

      const timestamp = Number(maybe.timestamp);
      if (!Number.isFinite(timestamp)) {
        continue;
      }

      sanitized.push({
        type: maybe.type,
        taskId: maybe.taskId,
        timestamp,
        proofProvided: Boolean(maybe.proofProvided),
      });
    }

    return sanitized;
  } catch {
    return [];
  }
}

function writeProgressHistory(history: StoredProgressAction[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(history.slice(-HISTORY_WINDOW)),
  );
}

function countCompletionStreak(history: StoredProgressAction[]): number {
  let streak = 0;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index]?.type === "complete") {
      streak += 1;
      continue;
    }
    break;
  }

  return streak;
}

function summarizeHistory(history: StoredProgressAction[]): ProgressionMeta {
  const recent = history.slice(-HISTORY_WINDOW);
  const completedCount = recent.filter((entry) => entry.type === "complete").length;
  const rerollCount = recent.filter((entry) => entry.type === "reroll").length;
  const skipCount = recent.filter((entry) => entry.type === "skip").length;
  const proofCount = recent.filter((entry) => entry.proofProvided).length;
  const streak = countCompletionStreak(recent);

  return {
    completedCount,
    rerollCount,
    skipCount,
    proofCount,
    streak,
    total: recent.length,
  };
}

export function deriveProgressionState(
  actions: StoredProgressAction[],
): ProgressionState {
  const meta = summarizeHistory(actions);

  if (meta.total < 3 || meta.completedCount < 2) {
    return "warming-up";
  }

  if (
    meta.streak >= 3 &&
    meta.completedCount >= 7 &&
    meta.rerollCount <= 1 &&
    meta.skipCount === 0 &&
    meta.proofCount <= meta.completedCount
  ) {
    return "locked-in";
  }

  if (meta.rerollCount + meta.skipCount >= 4 || (meta.total >= 5 && meta.streak === 0)) {
    return "slipping";
  }

  return "steady";
}

export function getProgressionState(): ProgressionState {
  return deriveProgressionState(readProgressHistory());
}

export function getRecentProgressActions(
  limit = HISTORY_WINDOW,
): Array<{
  type: ProgressActionType;
  taskId?: string;
  timestamp: number;
  proofProvided?: boolean;
}> {
  return readProgressHistory().slice(-Math.max(1, limit));
}

export function getRecentProgressSignals(limit = HISTORY_WINDOW): ProgressionSignals {
  const summary = summarizeHistory(readProgressHistory().slice(-Math.max(1, limit)));
  return {
    completed: summary.completedCount,
    rerolled: summary.rerollCount,
    skipped: summary.skipCount,
    proofProvided: summary.proofCount,
    streak: summary.streak,
    total: summary.total,
  };
}

export function recordProgressAction(action: ProgressAction): ProgressionState {
  const history = readProgressHistory();
  history.push({
    type: action.type,
    taskId: action.taskId,
    timestamp: action.timestamp ?? Date.now(),
    proofProvided: action.proofProvided ?? false,
  });
  writeProgressHistory(history);
  return deriveProgressionState(history);
}

export function getProgressionStatusLine(state: ProgressionState): string {
  return pickFromPool(STATUS_PHRASES[state], `${state}:status`);
}

export function getProgressionCompletionPhrase(state: ProgressionState): string {
  return pickFromPool(COMPLETION_PHRASES[state], `${state}:completion`);
}

export function getProgressionToneHint(state: ProgressionState): string {
  return pickFromPool(TONE_HINTS[state], `${state}:tone-hint`);
}

export const progressionStorageKey = HISTORY_KEY;
