"use client";

import { useMemo, useState } from "react";

import {
  getAllBuiltInTasks,
  getRerollsRemaining,
  markRerollUsed,
  onboardingStorageKey,
  pickRandomTask,
  readOnboardingPreferences,
} from "@/lib/task-picker";
import {
  applyCustomFlavor,
  applyTone,
  customFlavorKey,
  getToneRewardPhrase,
  getToneStatusPhrase,
  resolveToneFromPreferences,
} from "@/lib/tone";
import type { OnboardingPreferences, Task, ToneProfile } from "@/types/task";

function normalizeLabel(value: string) {
  return value.replace(/-/g, " ");
}

function toArray<T>(value?: T | T[]): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function formatPreferences(preferences: OnboardingPreferences | null) {
  return {
    category: toArray(preferences?.category),
    publicLevel: toArray(preferences?.publicLevel),
    time: toArray(preferences?.time),
    mode: toArray(preferences?.mode).map(normalizeLabel),
    tone: resolveToneFromPreferences(preferences),
  };
}

export function TaskHome() {
  const allTasks = useMemo(() => getAllBuiltInTasks(), []);
  const initialPreferences = useMemo(() => readOnboardingPreferences(), []);
  const initialTask = useMemo(
    () => pickRandomTask(allTasks, initialPreferences),
    [allTasks, initialPreferences],
  );

  const [task, setTask] = useState<Task | null>(initialTask);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(
    initialTask
      ? null
      : `No eligible task found for current preferences in "${onboardingStorageKey}".`,
  );
  const [rerollsRemaining, setRerollsRemaining] = useState(() =>
    getRerollsRemaining(),
  );
  const [activeFilters] = useState(() => formatPreferences(initialPreferences));
  const activeTone = useMemo<ToneProfile>(
    () => activeFilters.tone ?? "affirming",
    [activeFilters.tone],
  );
  const customFlavor = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(customFlavorKey);
  }, []);
  const tonedTaskText = useMemo(() => {
    if (!task) {
      return "";
    }

    const withTone = applyTone(task.text, activeTone);
    return applyCustomFlavor(withTone, customFlavor);
  }, [activeTone, customFlavor, task]);
  const toneStatusPhrase = useMemo(
    () => getToneStatusPhrase(activeTone),
    [activeTone],
  );

  function onComplete() {
    if (!task) return;
    setIsCompleted(true);
    const rewardPhrase = getToneRewardPhrase(activeTone);
    setFeedback(
      [task.completionText ?? "Task completed. Nicely done.", rewardPhrase]
        .filter(Boolean)
        .join(" "),
    );
  }

  function onReroll() {
    if (!task) return;

    const preferences = readOnboardingPreferences();
    const nextTask = pickRandomTask(allTasks, preferences, task.id);

    if (!nextTask) {
      setFeedback("No additional eligible task is available right now.");
      return;
    }

    const rerollState = markRerollUsed();
    if (!rerollState.allowed) {
      setFeedback("You have used all rerolls for today.");
      setRerollsRemaining(0);
      return;
    }

    setRerollsRemaining(rerollState.remaining);
    setIsCompleted(false);

    setTask(nextTask);
    setFeedback("Fresh task ready.");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-rose-50 via-white to-slate-50 px-6 py-16">
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute left-10 top-10 h-56 w-56 rounded-full bg-rose-200/50 blur-3xl" />
        <div className="absolute bottom-14 right-10 h-64 w-64 rounded-full bg-violet-200/40 blur-3xl" />
      </div>

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-white/70 bg-white/75 px-6 py-10 shadow-xl shadow-slate-200/50 backdrop-blur-sm sm:px-8">
        <header className="text-center">
          <p className="mx-auto inline-flex rounded-full border border-rose-100 bg-rose-50 px-4 py-1 text-xs font-medium uppercase tracking-[0.18em] text-rose-500">
            Velvet Orders
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            One intentional task at a time.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Starter packs are active. Tasks are filtered by local onboarding
            preferences and selected locally.
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-slate-500">
            LocalStorage key:{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">
              {onboardingStorageKey}
            </code>
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-slate-500">
            Active filters — category:{" "}
            {activeFilters.category.length > 0
              ? activeFilters.category.join(", ")
              : "any"}{" "}
            | public level:{" "}
            {activeFilters.publicLevel.length > 0
              ? activeFilters.publicLevel.join(", ")
              : "any"}{" "}
            | time:{" "}
            {activeFilters.time.length > 0 ? activeFilters.time.join(", ") : "any"}{" "}
            | mode:{" "}
            {activeFilters.mode.length > 0 ? activeFilters.mode.join(", ") : "any"}{" "}
            | tone: {normalizeLabel(activeTone)}
          </p>
          {toneStatusPhrase ? (
            <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-rose-500/90">
              {toneStatusPhrase}
            </p>
          ) : null}
        </header>

        {task ? (
          <article className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm sm:px-6">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                {task.category}
              </span>
              <span className="rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-600">
                intensity {task.intensity}/10
              </span>
              <span className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-600">
                {task.time}
              </span>
              <span className="rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-600">
                {task.publicLevel}
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-slate-900">
              {task.title}
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
              {tonedTaskText}
            </p>

            <p className="mt-4 text-xs text-slate-500">
              Mode(s): {task.modes.map((mode) => normalizeLabel(mode)).join(", ")}
            </p>
          </article>
        ) : (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-700">
            No task available.
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onComplete}
            disabled={!task}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Complete
          </button>
          <button
            type="button"
            onClick={onReroll}
            disabled={!task || rerollsRemaining < 1}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reroll
          </button>
          <span className="text-xs text-slate-500">
            Rerolls left today: {rerollsRemaining}/2
          </span>
        </div>

        {feedback ? (
          <p
            className={`rounded-xl px-4 py-3 text-sm ${
              isCompleted
                ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border border-slate-100 bg-slate-50 text-slate-600"
            }`}
          >
            {feedback}
          </p>
        ) : null}
      </section>
    </main>
  );
}
