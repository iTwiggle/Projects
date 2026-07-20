import { BUILT_IN_TASK_PACKS } from "@/data/task-packs";
import type { Task, TaskMode, TaskPack, TaskTime, TaskWithPackMeta } from "@/types/task";

const USER_PACKS_KEY = "velvet-orders:user-task-packs";
const BUILTIN_ENABLED_KEY = "velvet-orders:built-in-pack-enabled";

const VALID_PUBLIC_LEVELS = new Set(["private", "subtle", "public"]);
const VALID_TIMES = new Set(["quick", "normal", "long"]);
const VALID_MODES = new Set([
  "playful",
  "strict",
  "affirming",
  "teasing",
  "dominant-teasing",
]);

type BuiltInEnabledState = Record<string, boolean>;

const cloneTask = (task: Task): Task => ({
  ...task,
  tags: task.tags ? [...task.tags] : undefined,
});

const clonePack = (pack: TaskPack): TaskPack => ({
  ...pack,
  tasks: pack.tasks.map(cloneTask),
});

const toSlug = (value: string, fallback: string): string => {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

function readBuiltInEnabledState(): BuiltInEnabledState {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(BUILTIN_ENABLED_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed)) {
      return {};
    }

    const state: BuiltInEnabledState = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "boolean") {
        state[key] = value;
      }
    }
    return state;
  } catch {
    return {};
  }
}

function writeBuiltInEnabledState(state: BuiltInEnabledState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(BUILTIN_ENABLED_KEY, JSON.stringify(state));
}

function validateTaskShape(task: unknown, context: string): Task {
  if (!isObject(task)) {
    throw new Error(`${context}: task is not a valid object.`);
  }

  const id = asString(task.id);
  const title = asString(task.title);
  const category = asString(task.category);
  const text = asString(task.text);
  const intensity = Number(task.intensity);
  const publicLevel = asString(task.publicLevel);
  const time = asString(task.time);

  if (!id || !title || !category || !text) {
    throw new Error(`${context}: task is missing required fields.`);
  }

  if (!Number.isFinite(intensity) || intensity < 1 || intensity > 10) {
    throw new Error(`${context}: task intensity must be 1-10.`);
  }

  if (!publicLevel || !VALID_PUBLIC_LEVELS.has(publicLevel)) {
    throw new Error(`${context}: task publicLevel is invalid.`);
  }

  if (!time || !VALID_TIMES.has(time)) {
    throw new Error(`${context}: task time is invalid.`);
  }

  if (!Array.isArray(task.modes) || task.modes.length === 0) {
    throw new Error(`${context}: task modes must be a non-empty array.`);
  }

  const modes = task.modes.map((mode) => asString(mode));
  if (modes.some((mode) => !mode || !VALID_MODES.has(mode))) {
    throw new Error(`${context}: task contains an invalid mode.`);
  }

  const completionText = task.completionText
    ? asString(task.completionText)
    : undefined;
  const tags = Array.isArray(task.tags)
    ? task.tags
        .map((tag) => asString(tag))
        .filter((tag): tag is string => Boolean(tag))
    : undefined;

  return {
    id,
    title,
    category,
    text,
    intensity: Math.round(intensity),
    publicLevel: publicLevel as Task["publicLevel"],
    time: time as TaskTime,
    modes: modes as TaskMode[],
    completionText: completionText ?? undefined,
    tags,
    customFlavorKey: asString(task.customFlavorKey) ?? undefined,
    privateNotes: asString(task.privateNotes) ?? undefined,
  };
}

function validateStoredPack(pack: unknown): TaskPack | null {
  if (!isObject(pack)) {
    return null;
  }

  const source = asString(pack.source);
  if (source !== "imported" && source !== "custom") {
    return null;
  }

  const id = asString(pack.id);
  const name = asString(pack.name);
  if (!id || !name || !Array.isArray(pack.tasks)) {
    return null;
  }

  try {
    const tasks = pack.tasks.map((task, index) =>
      validateTaskShape(task, `Stored pack ${id}, task ${index + 1}`),
    );
    return {
      id,
      name,
      description: asString(pack.description) ?? undefined,
      version: asString(pack.version) ?? undefined,
      enabled: typeof pack.enabled === "boolean" ? pack.enabled : true,
      source,
      flavorProfile: asString(pack.flavorProfile) ?? undefined,
      tasks,
    };
  } catch {
    return null;
  }
}

function readUserPacks(): TaskPack[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(USER_PACKS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((pack) => validateStoredPack(pack))
      .filter((pack): pack is TaskPack => pack !== null);
  } catch {
    return [];
  }
}

function writeUserPacks(packs: TaskPack[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USER_PACKS_KEY, JSON.stringify(packs));
}

function getBuiltInPacks(): TaskPack[] {
  const builtInEnabled = readBuiltInEnabledState();
  return BUILT_IN_TASK_PACKS.map((pack) => ({
    ...clonePack(pack),
    source: "built-in",
    enabled:
      typeof builtInEnabled[pack.id] === "boolean"
        ? builtInEnabled[pack.id]
        : pack.enabled,
  }));
}

function collectTaskIds(packs: TaskPack[]): Set<string> {
  const ids = new Set<string>();
  for (const pack of packs) {
    for (const task of pack.tasks) {
      ids.add(task.id);
    }
  }
  return ids;
}

function ensureUniquePackId(baseId: string, existingIds: Set<string>): string {
  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let index = 2;
  let candidate = `${baseId}-${index}`;
  while (existingIds.has(candidate)) {
    index += 1;
    candidate = `${baseId}-${index}`;
  }
  return candidate;
}

function namespaceTaskIds(
  packId: string,
  tasks: Task[],
  existingTaskIds: Set<string>,
): Task[] {
  return tasks.map((task) => {
    const baseId = toSlug(`${packId}-${task.id}`, "task");
    let candidate = baseId;
    let suffix = 2;
    while (existingTaskIds.has(candidate)) {
      candidate = `${baseId}-${suffix}`;
      suffix += 1;
    }
    existingTaskIds.add(candidate);

    return {
      ...task,
      id: candidate,
    };
  });
}

function validateImportPack(raw: unknown, existingPacks: TaskPack[]): TaskPack {
  if (!isObject(raw)) {
    throw new Error("Imported file must contain a JSON object.");
  }

  if (!Array.isArray(raw.tasks) || raw.tasks.length === 0) {
    throw new Error("Imported pack must include a non-empty tasks array.");
  }

  const existingPackIds = new Set(existingPacks.map((pack) => pack.id));
  const rawId = asString(raw.id) ?? `imported-${Date.now()}`;
  const packId = ensureUniquePackId(toSlug(rawId, "imported-pack"), existingPackIds);

  const parsedTasks = raw.tasks.map((task, index) =>
    validateTaskShape(task, `Imported pack ${packId}, task ${index + 1}`),
  );
  const uniqueTasks = namespaceTaskIds(packId, parsedTasks, collectTaskIds(existingPacks));

  return {
    id: packId,
    name: asString(raw.name) ?? "Imported Pack",
    description: asString(raw.description) ?? undefined,
    version: asString(raw.version) ?? undefined,
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : true,
    source: "imported",
    flavorProfile: asString(raw.flavorProfile) ?? undefined,
    tasks: uniqueTasks,
  };
}

export function getAllTaskPacks(): TaskPack[] {
  return [...getBuiltInPacks(), ...readUserPacks()];
}

export function getEnabledTasksFromPacks(packs: TaskPack[]): TaskWithPackMeta[] {
  return packs
    .filter((pack) => pack.enabled)
    .flatMap((pack) =>
      pack.tasks.map((task) => ({
        ...cloneTask(task),
        packId: pack.id,
        packName: pack.name,
        packSource: pack.source,
        tags: [...(task.tags ?? []), `pack:${pack.id}`],
      })),
    );
}

export function setTaskPackEnabled(packId: string, enabled: boolean): TaskPack[] {
  const builtIns = getBuiltInPacks();
  const isBuiltIn = builtIns.some((pack) => pack.id === packId);

  if (isBuiltIn) {
    const current = readBuiltInEnabledState();
    current[packId] = enabled;
    writeBuiltInEnabledState(current);
  } else {
    const userPacks = readUserPacks().map((pack) =>
      pack.id === packId ? { ...pack, enabled } : pack,
    );
    writeUserPacks(userPacks);
  }

  return getAllTaskPacks();
}

export function deleteTaskPack(packId: string): TaskPack[] {
  const userPacks = readUserPacks();
  const nextUserPacks = userPacks.filter((pack) => pack.id !== packId);
  writeUserPacks(nextUserPacks);
  return getAllTaskPacks();
}

export function importTaskPackFromJson(rawJson: string): {
  packs: TaskPack[];
  importedPack: TaskPack;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("Invalid JSON file.");
  }

  const existingPacks = getAllTaskPacks();
  const importedPack = validateImportPack(parsed, existingPacks);
  const userPacks = [...readUserPacks(), importedPack];
  writeUserPacks(userPacks);

  return {
    packs: getAllTaskPacks(),
    importedPack,
  };
}

export function exportTaskPackJson(pack: TaskPack): string {
  return JSON.stringify(pack, null, 2);
}

export function exportUserPacksJson(packs: TaskPack[]): string {
  return JSON.stringify(
    packs.filter((pack) => pack.source !== "built-in"),
    null,
    2,
  );
}

export function downloadJsonFile(filename: string, contents: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
