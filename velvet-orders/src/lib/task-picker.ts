import { BUILT_IN_TASK_PACKS } from "@/data/task-packs";
import {
  getRecentProgressActions,
  getRecentProgressSignals,
} from "@/lib/progression";
import type {
  AdaptivePickResult,
  OnboardingPreferences,
  Task,
  TaskWithPackMeta,
} from "@/types/task";

const ONBOARDING_KEY = "velvet-orders:onboarding-preferences";
const REROLL_KEY = "velvet-orders:reroll-counter";
const MAX_DAILY_REROLLS = 2;

export const TASK_SCORING_TUNING = {
  historyWindow: 10,
  baseScore: 10,
  preferredCategoryBonus: 2,
  maxIntensityFitBonus: 3,
  intensityDistancePenalty: 0.8,
  recentCompletionBonusPerCategoryMatch: 1.4,
  rerollPenaltyPerCategoryMatch: 1.8,
  skipPenaltyPerCategoryMatch: 2.2,
  repetitionPenaltyPerSameTask: 2.5,
  proofBonusPerCategoryMatch: 0.75,
  maxAdaptiveIntensityShift: 1.5,
  topPoolSize: 3,
  minSelectableScore: 0.1,
} as const;

type RerollCounter = {
  day: string;
  count: number;
};

type ProgressActionSnapshot = {
  type: "complete" | "reroll" | "skip";
  taskId?: string;
  timestamp: number;
  proofProvided?: boolean;
};

type TaskLookup = Map<string, TaskWithPackMeta>;

export type TaskScoreBreakdown = {
  baseScore: number;
  preferredCategoryBonus: number;
  intensityFitBonus: number;
  recentCompletionBonus: number;
  rerollPenalty: number;
  skipPenalty: number;
  repetitionPenalty: number;
  proofBonus: number;
  finalScore: number;
};

export type ScoredTaskCandidate = {
  task: TaskWithPackMeta;
  finalScore: number;
  breakdown: TaskScoreBreakdown;
};

export type AdaptiveTaskDebug = {
  targetIntensity: number;
  adaptiveIntensityAdjustment: number;
  signals: {
    completed: number;
    rerolled: number;
    skipped: number;
    proofProvided: number;
    streak: number;
    total: number;
  };
  topCandidates: Array<{
    taskId: string;
    title: string;
    category: string;
    intensity: number;
    finalScore: number;
    breakdown: TaskScoreBreakdown;
  }>;
};

export type AdaptiveTaskPickResult = {
  selectedTask: Task | null;
  scoredCandidates: ScoredTaskCandidate[];
  debug: AdaptiveTaskDebug | null;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const asArray = <T,>(value: T | T[] | undefined): T[] => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const getRandomItem = <T,>(items: T[]): T | null => {
  if (items.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? null;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const weightedRandomPick = (
  candidates: ScoredTaskCandidate[],
): ScoredTaskCandidate | null => {
  if (candidates.length === 0) {
    return null;
  }

  const totalWeight = candidates.reduce(
    (sum, candidate) => sum + Math.max(candidate.finalScore, 0),
    0,
  );
  if (totalWeight <= 0) {
    return getRandomItem(candidates);
  }

  let cursor = Math.random() * totalWeight;
  for (const candidate of candidates) {
    cursor -= Math.max(candidate.finalScore, 0);
    if (cursor <= 0) {
      return candidate;
    }
  }

  return candidates[candidates.length - 1] ?? null;
};

const getTaskLookup = (tasks: TaskWithPackMeta[]): TaskLookup =>
  new Map(tasks.map((task) => [task.id, task]));

const average = (values: number[]): number => {
  if (values.length === 0) {
    return 5;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getAdaptiveIntensityTarget = (
  tasks: TaskWithPackMeta[],
  recentActions: ProgressActionSnapshot[],
): { target: number; adjustment: number } => {
  const signals = getRecentProgressSignals(TASK_SCORING_TUNING.historyWindow);
  const total = Math.max(1, signals.total);
  const completionRate = signals.completed / total;
  const frictionRate = (signals.rerolled + signals.skipped) / total;
  const proofRate = signals.proofProvided / total;

  const taskLookup = getTaskLookup(tasks);
  const completedIntensities = recentActions
    .filter((action) => action.type === "complete" && action.taskId)
    .map((action) => taskLookup.get(action.taskId ?? "")?.intensity)
    .filter((intensity): intensity is number => typeof intensity === "number");
  const baseIntensity = average(completedIntensities);

  let shift = 0;
  if (signals.total >= 3) {
    shift =
      (completionRate - 0.5) * 1.6 -
      frictionRate * 1.2 +
      Math.min(3, signals.streak) * 0.25 +
      proofRate * 0.2;
  }

  const adjustment = clamp(
    shift,
    -TASK_SCORING_TUNING.maxAdaptiveIntensityShift,
    TASK_SCORING_TUNING.maxAdaptiveIntensityShift,
  );

  return {
    target: clamp(baseIntensity + adjustment, 1, 10),
    adjustment,
  };
};

const countRecentBy = (
  actions: ProgressActionSnapshot[],
  predicate: (action: ProgressActionSnapshot) => boolean,
) => actions.filter(predicate).length;

const scoreTask = (
  task: TaskWithPackMeta,
  preferences: OnboardingPreferences | null,
  recentActions: ProgressActionSnapshot[],
  taskLookup: TaskLookup,
  targetIntensity: number,
): ScoredTaskCandidate => {
  const preferredCategories = asArray(preferences?.category);

  const preferredCategoryBonus = preferredCategories.includes(task.category)
    ? TASK_SCORING_TUNING.preferredCategoryBonus
    : 0;
  const intensityFitBonus = Math.max(
    0,
    TASK_SCORING_TUNING.maxIntensityFitBonus -
      Math.abs(task.intensity - targetIntensity) *
        TASK_SCORING_TUNING.intensityDistancePenalty,
  );

  const sameCategoryCompletions = countRecentBy(
    recentActions,
    (action) =>
      action.type === "complete" &&
      !!action.taskId &&
      taskLookup.get(action.taskId)?.category === task.category,
  );
  const sameCategoryRerolls = countRecentBy(
    recentActions,
    (action) =>
      action.type === "reroll" &&
      !!action.taskId &&
      taskLookup.get(action.taskId)?.category === task.category,
  );
  const sameCategorySkips = countRecentBy(
    recentActions,
    (action) =>
      action.type === "skip" &&
      !!action.taskId &&
      taskLookup.get(action.taskId)?.category === task.category,
  );
  const repeatedTaskCount = countRecentBy(
    recentActions,
    (action) => action.taskId === task.id,
  );
  const sameCategoryProofCompletions = countRecentBy(
    recentActions,
    (action) =>
      action.type === "complete" &&
      !!action.proofProvided &&
      !!action.taskId &&
      taskLookup.get(action.taskId)?.category === task.category,
  );

  const recentCompletionBonus =
    sameCategoryCompletions *
    TASK_SCORING_TUNING.recentCompletionBonusPerCategoryMatch;
  const rerollPenalty =
    sameCategoryRerolls * TASK_SCORING_TUNING.rerollPenaltyPerCategoryMatch * -1;
  const skipPenalty =
    sameCategorySkips * TASK_SCORING_TUNING.skipPenaltyPerCategoryMatch * -1;
  const repetitionPenalty =
    repeatedTaskCount * TASK_SCORING_TUNING.repetitionPenaltyPerSameTask * -1;
  const proofBonus =
    sameCategoryProofCompletions * TASK_SCORING_TUNING.proofBonusPerCategoryMatch;

  const rawScore =
    TASK_SCORING_TUNING.baseScore +
    preferredCategoryBonus +
    intensityFitBonus +
    recentCompletionBonus +
    rerollPenalty +
    skipPenalty +
    repetitionPenalty +
    proofBonus;

  const finalScore = Math.max(TASK_SCORING_TUNING.minSelectableScore, rawScore);
  const breakdown: TaskScoreBreakdown = {
    baseScore: TASK_SCORING_TUNING.baseScore,
    preferredCategoryBonus,
    intensityFitBonus,
    recentCompletionBonus,
    rerollPenalty,
    skipPenalty,
    repetitionPenalty,
    proofBonus,
    finalScore,
  };

  return { task, finalScore, breakdown };
};

export const getAllBuiltInTasks = (): Task[] => {
  return BUILT_IN_TASK_PACKS.filter((pack) => pack.enabled).flatMap((pack) =>
    pack.tasks.map((task) => ({
      ...task,
      tags: [...(task.tags ?? []), `pack:${pack.id}`],
    }))
  );
};

export const readOnboardingPreferences =
  (): OnboardingPreferences | null => {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = window.localStorage.getItem(ONBOARDING_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }

      const maybePrefs = parsed as Partial<OnboardingPreferences>;
      return {
        category: asArray(maybePrefs.category),
        publicLevel: asArray(maybePrefs.publicLevel),
        time: asArray(maybePrefs.time),
        mode: asArray(maybePrefs.mode),
        tone: maybePrefs.tone,
      };
    } catch {
      return null;
    }
  };

const matchesPreference = <T,>(selected: T[] | undefined, value: T): boolean => {
  if (!selected || selected.length === 0) {
    return true;
  }

  return selected.includes(value);
};

export const getEligibleTasks = (
  tasks: Task[],
  preferences: OnboardingPreferences | null
): Task[] => {
  if (!preferences) {
    return tasks;
  }

  return tasks.filter((task) => {
    const categoryMatch = matchesPreference(
      asArray(preferences.category),
      task.category
    );
    const publicLevelMatch = matchesPreference(
      asArray(preferences.publicLevel),
      task.publicLevel
    );
    const timeMatch = matchesPreference(asArray(preferences.time), task.time);
    const modeMatch =
      asArray(preferences.mode).length === 0 ||
      task.modes.some((mode) => asArray(preferences.mode).includes(mode));

    return categoryMatch && publicLevelMatch && timeMatch && modeMatch;
  });
};

export const pickRandomTask = (
  tasks: TaskWithPackMeta[],
  preferences: OnboardingPreferences | null,
  excludeTaskId?: string
): Task | null => {
  return pickAdaptiveTask(tasks, preferences, excludeTaskId).selectedTask;
};

export const pickAdaptiveTask = (
  tasks: TaskWithPackMeta[],
  preferences: OnboardingPreferences | null,
  excludeTaskId?: string,
): AdaptiveTaskPickResult => {
  const eligible = getEligibleTasks(tasks, preferences).filter(
    (task) => task.id !== excludeTaskId,
  );
  if (eligible.length === 0) {
    return {
      selectedTask: null,
      scoredCandidates: [],
      debug: null,
    };
  }

  const recentActions = getRecentProgressActions(
    TASK_SCORING_TUNING.historyWindow,
  ) as ProgressActionSnapshot[];
  const signals = getRecentProgressSignals(TASK_SCORING_TUNING.historyWindow);
  const taskLookup = getTaskLookup(tasks);
  const intensityTarget = getAdaptiveIntensityTarget(tasks, recentActions);

  const scoredCandidates = eligible
    .map((task) =>
      scoreTask(
        task,
        preferences,
        recentActions,
        taskLookup,
        intensityTarget.target,
      ),
    )
    .sort((a, b) => b.finalScore - a.finalScore);

  const topCandidates = scoredCandidates.slice(
    0,
    Math.min(TASK_SCORING_TUNING.topPoolSize, scoredCandidates.length),
  );
  const selected = weightedRandomPick(topCandidates);

  const debug: AdaptiveTaskDebug = {
    targetIntensity: Number(intensityTarget.target.toFixed(2)),
    adaptiveIntensityAdjustment: Number(intensityTarget.adjustment.toFixed(2)),
    signals,
    topCandidates: topCandidates.map((candidate) => ({
      taskId: candidate.task.id,
      title: candidate.task.title,
      category: candidate.task.category,
      intensity: candidate.task.intensity,
      packId: candidate.task.packId,
      packName: candidate.task.packName,
      packSource: candidate.task.packSource,
      finalScore: Number(candidate.finalScore.toFixed(2)),
      breakdown: {
        ...candidate.breakdown,
        finalScore: Number(candidate.breakdown.finalScore.toFixed(2)),
      },
    })),
  };

  return {
    selectedTask: selected?.task ?? null,
    scoredCandidates,
    debug,
  };
};

export const getAdaptivePickResult = (
  tasks: TaskWithPackMeta[],
  preferences: OnboardingPreferences | null,
  excludeTaskId?: string,
): AdaptivePickResult => {
  const result = pickAdaptiveTask(tasks, preferences, excludeTaskId);
  const topCandidates = result.debug?.topCandidates ?? [];

  return {
    selectedTask: result.selectedTask,
    targetIntensity: result.debug?.targetIntensity ?? 5,
    intensityAdjustment: result.debug?.adaptiveIntensityAdjustment ?? 0,
    signals: result.debug?.signals ?? {
      completed: 0,
      rerolled: 0,
      skipped: 0,
      proofProvided: 0,
      streak: 0,
      total: 0,
    },
    topPoolSize: topCandidates.length,
    eligibleCount: result.scoredCandidates.length,
    candidates: topCandidates,
  };
};

const readRerollCounter = (): RerollCounter => {
  if (typeof window === "undefined") {
    return { day: todayKey(), count: 0 };
  }

  const raw = window.localStorage.getItem(REROLL_KEY);
  if (!raw) {
    return { day: todayKey(), count: 0 };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "day" in parsed &&
      "count" in parsed
    ) {
      const day = String((parsed as RerollCounter).day);
      const count = Number((parsed as RerollCounter).count);
      if (day === todayKey() && Number.isFinite(count)) {
        return { day, count: Math.max(0, count) };
      }
    }
  } catch {
    // Fall through to reset.
  }

  return { day: todayKey(), count: 0 };
};

const writeRerollCounter = (counter: RerollCounter): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(REROLL_KEY, JSON.stringify(counter));
};

export const getRerollsRemaining = (): number => {
  const counter = readRerollCounter();
  return Math.max(0, MAX_DAILY_REROLLS - counter.count);
};

export const markRerollUsed = (): { allowed: boolean; remaining: number } => {
  const counter = readRerollCounter();
  if (counter.count >= MAX_DAILY_REROLLS) {
    return { allowed: false, remaining: 0 };
  }

  const next = { day: counter.day, count: counter.count + 1 };
  writeRerollCounter(next);

  return {
    allowed: true,
    remaining: Math.max(0, MAX_DAILY_REROLLS - next.count),
  };
};

export const onboardingStorageKey = ONBOARDING_KEY;
