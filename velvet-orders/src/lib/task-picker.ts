import { BUILT_IN_TASK_PACKS } from "@/data/task-packs";
import type { OnboardingPreferences, Task } from "@/types/task";

const ONBOARDING_KEY = "velvet-orders:onboarding-preferences";
const REROLL_KEY = "velvet-orders:reroll-counter";
const MAX_DAILY_REROLLS = 2;

type RerollCounter = {
  day: string;
  count: number;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const getRandomItem = <T,>(items: T[]): T | null => {
  if (items.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? null;
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
        categories: Array.isArray(maybePrefs.categories)
          ? maybePrefs.categories
          : [],
        publicLevels: Array.isArray(maybePrefs.publicLevels)
          ? maybePrefs.publicLevels
          : [],
        times: Array.isArray(maybePrefs.times) ? maybePrefs.times : [],
        modes: Array.isArray(maybePrefs.modes) ? maybePrefs.modes : [],
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
    const categoryMatch = matchesPreference(preferences.categories, task.category);
    const publicLevelMatch = matchesPreference(
      preferences.publicLevels,
      task.publicLevel
    );
    const timeMatch = matchesPreference(preferences.times, task.time);
    const modeMatch =
      !preferences.modes ||
      preferences.modes.length === 0 ||
      task.modes.some((mode) => preferences.modes?.includes(mode));

    return categoryMatch && publicLevelMatch && timeMatch && modeMatch;
  });
};

export const pickRandomTask = (
  tasks: Task[],
  preferences: OnboardingPreferences | null,
  excludeTaskId?: string
): Task | null => {
  const eligible = getEligibleTasks(tasks, preferences).filter(
    (task) => task.id !== excludeTaskId
  );
  return getRandomItem(eligible);
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

export const canUseReroll = (): boolean => getRerollsRemaining() > 0;

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
