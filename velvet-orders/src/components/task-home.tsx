"use client";

import { useMemo, useRef, useState } from "react";

import {
  getAdaptivePickResult,
  getRerollsRemaining,
  markRerollUsed,
  onboardingStorageKey,
  readOnboardingPreferences,
} from "@/lib/task-picker";
import {
  deleteTaskPack,
  downloadJsonFile,
  exportTaskPackJson,
  exportUserPacksJson,
  getAllTaskPacks,
  getEnabledTasksFromPacks,
  importTaskPackFromJson,
  setTaskPackEnabled,
} from "@/lib/pack-manager";
import {
  getProgressionState,
  getProgressionStatusLine,
  recordProgressAction,
  getProgressionCompletionPhrase,
} from "@/lib/progression";
import {
  applyCustomFlavor,
  applyTone,
  customFlavorKey,
  getToneRewardPhrase,
  getToneStatusPhrase,
  resolveToneFromPreferences,
} from "@/lib/tone";
import type {
  AdaptivePickResult,
  OnboardingPreferences,
  ProgressionState,
  TaskPack,
  TaskWithPackMeta,
  ToneProfile,
} from "@/types/task";

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
  const initialPacks = useMemo(() => getAllTaskPacks(), []);
  const initialTasks = useMemo(
    () => getEnabledTasksFromPacks(initialPacks),
    [initialPacks],
  );
  const initialPreferences = useMemo(() => readOnboardingPreferences(), []);
  const initialPick = useMemo(
    () => getAdaptivePickResult(initialTasks, initialPreferences),
    [initialTasks, initialPreferences],
  );
  const initialTask = initialPick.selectedTask;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [packs, setPacks] = useState<TaskPack[]>(initialPacks);
  const allTasks = useMemo(() => getEnabledTasksFromPacks(packs), [packs]);
  const [task, setTask] = useState<TaskWithPackMeta | null>(initialTask);
  const [lastPickDebug, setLastPickDebug] = useState<AdaptivePickResult>(
    initialPick,
  );
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
  const [progressionState, setProgressionState] = useState<ProgressionState>(() =>
    getProgressionState(),
  );
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

    const withTone = applyTone(task.text, activeTone, progressionState);
    return applyCustomFlavor(withTone, customFlavor);
  }, [activeTone, customFlavor, progressionState, task]);
  const toneStatusPhrase = useMemo(
    () => getToneStatusPhrase(activeTone),
    [activeTone],
  );
  const progressionStatusLine = useMemo(
    () => getProgressionStatusLine(progressionState),
    [progressionState],
  );
  const userPacks = useMemo(
    () => packs.filter((pack) => pack.source !== "built-in"),
    [packs],
  );

  function refreshPickForPacks(nextPacks: TaskPack[], excludeTaskId?: string) {
    const nextTasks = getEnabledTasksFromPacks(nextPacks);
    const preferences = readOnboardingPreferences();
    const nextPick = getAdaptivePickResult(nextTasks, preferences, excludeTaskId);
    setTask(nextPick.selectedTask);
    setLastPickDebug(nextPick);

    if (!nextPick.selectedTask) {
      setFeedback(
        `No eligible task found for current preferences in "${onboardingStorageKey}".`,
      );
    }
  }

  function handleTogglePack(packId: string, enabled: boolean) {
    const nextPacks = setTaskPackEnabled(packId, enabled);
    setPacks(nextPacks);
    refreshPickForPacks(nextPacks, task?.id);
  }

  function handleDeletePack(packId: string) {
    const nextPacks = deleteTaskPack(packId);
    setPacks(nextPacks);
    refreshPickForPacks(nextPacks, task?.id);
    setFeedback("Pack deleted.");
  }

  async function handleImportPack(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const contents = await file.text();
      const { packs: nextPacks, importedPack } = importTaskPackFromJson(contents);
      setPacks(nextPacks);
      refreshPickForPacks(nextPacks, task?.id);
      setFeedback(`Imported "${importedPack.name}" (${importedPack.tasks.length} tasks).`);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to import pack from JSON.",
      );
    } finally {
      event.target.value = "";
    }
  }

  function handleExportPack(pack: TaskPack) {
    downloadJsonFile(`${pack.id}.json`, exportTaskPackJson(pack));
    setFeedback(`Exported "${pack.name}".`);
  }

  function handleExportUserPacks() {
    downloadJsonFile(
      "velvet-orders-imported-custom-packs.json",
      exportUserPacksJson(packs),
    );
    setFeedback("Exported imported/custom packs.");
  }

  function onComplete() {
    if (!task) return;
    setIsCompleted(true);
    const nextProgressionState = recordProgressAction({
      type: "complete",
      taskId: task.id,
      proofProvided: false,
    });
    setProgressionState(nextProgressionState);
    const rewardPhrase = getToneRewardPhrase(activeTone);
    const progressionCompletion = getProgressionCompletionPhrase(
      nextProgressionState,
    );
    const postCompletePick = getAdaptivePickResult(
      allTasks,
      readOnboardingPreferences(),
      task.id,
    );
    setLastPickDebug(postCompletePick);
    setFeedback(
      [
        task.completionText ?? "Task completed. Nicely done.",
        progressionCompletion,
        rewardPhrase,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  function onReroll() {
    if (!task) return;

    const preferences = readOnboardingPreferences();
    const nextPick = getAdaptivePickResult(allTasks, preferences, task.id);
    setLastPickDebug(nextPick);
    const nextTask = nextPick.selectedTask;

    if (!nextTask) {
      const nextProgressionState = recordProgressAction({
        type: "skip",
        taskId: task.id,
      });
      setProgressionState(nextProgressionState);
      setFeedback("No additional eligible task is available right now.");
      return;
    }

    const rerollState = markRerollUsed();
    if (!rerollState.allowed) {
      setFeedback("You have used all rerolls for today.");
      setRerollsRemaining(0);
      return;
    }

    const nextProgressionState = recordProgressAction({
      type: "reroll",
      taskId: task.id,
    });
    setProgressionState(nextProgressionState);
    setRerollsRemaining(rerollState.remaining);
    setIsCompleted(false);

    setTask(nextTask);
    setLastPickDebug(nextPick);
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
          <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-slate-500">
            Progression: {normalizeLabel(progressionState)}.
          </p>
          <p className="mx-auto mt-1 max-w-2xl text-xs leading-5 text-slate-500/90">
            {progressionStatusLine}
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
              <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-600">
                {task.packName}
              </span>
              <span className="rounded-full bg-indigo-100 px-3 py-1 font-medium text-indigo-700">
                {task.packSource}
              </span>
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

        <section className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Pack Manager</h3>
              <p className="text-xs text-slate-500">
                Manage built-in and imported packs locally.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Import JSON
              </button>
              <button
                type="button"
                onClick={handleExportUserPacks}
                disabled={userPacks.length === 0}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export imported/custom
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportPack}
                className="hidden"
              />
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {packs.map((pack) => (
              <li
                key={pack.id}
                className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {pack.name}
                    </p>
                    {pack.description ? (
                      <p className="mt-0.5 text-xs text-slate-500">{pack.description}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-slate-500">
                      source: {pack.source} | tasks: {pack.tasks.length}
                      {pack.version ? ` | version: ${pack.version}` : ""}
                      {pack.flavorProfile ? ` | flavor: ${pack.flavorProfile}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={pack.enabled}
                        onChange={(event) =>
                          handleTogglePack(pack.id, event.target.checked)
                        }
                      />
                      enabled
                    </label>
                    <button
                      type="button"
                      onClick={() => handleExportPack(pack)}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      Export
                    </button>
                    {pack.source !== "built-in" ? (
                      <button
                        type="button"
                        onClick={() => handleDeletePack(pack.id)}
                        className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {process.env.NODE_ENV !== "production" ? (
          <details className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-600">
            <summary className="cursor-pointer font-medium text-slate-700">
              Dev scoring debug
            </summary>
            <div className="mt-3 space-y-2">
              <p>
                Adaptive target intensity:{" "}
                <span className="font-medium text-slate-700">
                  {lastPickDebug.targetIntensity}
                </span>{" "}
                (adjustment {lastPickDebug.intensityAdjustment >= 0 ? "+" : ""}
                {lastPickDebug.intensityAdjustment})
              </p>
              <p>
                Signals — completed: {lastPickDebug.signals.completed} | rerolled:{" "}
                {lastPickDebug.signals.rerolled} | skipped:{" "}
                {lastPickDebug.signals.skipped} | proof:{" "}
                {lastPickDebug.signals.proofProvided} | streak:{" "}
                {lastPickDebug.signals.streak}
              </p>
              <p>
                Candidate pool: {lastPickDebug.topPoolSize} /{" "}
                {lastPickDebug.eligibleCount} eligible
              </p>
              <ul className="space-y-2">
                {lastPickDebug.candidates.map((candidate) => (
                  <li
                    key={candidate.taskId}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <p className="font-medium text-slate-700">
                      {candidate.title} ({candidate.category}) —{" "}
                      {candidate.finalScore.toFixed(2)}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      pack {candidate.packName} ({candidate.packSource})
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      base {candidate.breakdown.baseScore.toFixed(2)} | pref{" "}
                      {candidate.breakdown.preferredCategoryBonus.toFixed(2)} |
                      intensity {candidate.breakdown.intensityFitBonus.toFixed(2)} |
                      completion{" "}
                      {candidate.breakdown.recentCompletionBonus.toFixed(2)} | reroll{" "}
                      {candidate.breakdown.rerollPenalty.toFixed(2)} | skip{" "}
                      {candidate.breakdown.skipPenalty.toFixed(2)} | repeat{" "}
                      {candidate.breakdown.repetitionPenalty.toFixed(2)} | proof{" "}
                      {candidate.breakdown.proofBonus.toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ) : null}
      </section>
    </main>
  );
}
