import type {
  AlbumContext,
  CoverGeneratorSettings,
  GeneratorSettings,
  LyricIdea,
  MoodOption,
  RhymeSchemeOption,
} from "@/app/types";

export const DEFAULT_MOODS: MoodOption[] = [
  "nostalgic",
  "reflective",
  "aggressive",
  "playful",
  "melancholic",
  "triumphant",
  "cinematic",
  "surreal",
];

export const RHYME_SCHEMES: RhymeSchemeOption[] = [
  "none",
  "AABB",
  "ABAB",
  "AA",
  "internal rhyme",
  "mixed",
  "loose / freeform",
];

export const OUTPUT_TYPES = [
  "single lines",
  "couplets",
  "4-bar ideas",
  "punchlines",
  "hooks",
  "title ideas",
] as const;

export const COMPLEXITY_OPTIONS = ["simple", "layered", "abstract", "direct"] as const;

export function toKeywordList(value: string): string[] {
  return value
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

export function splitList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function seededPick<T>(items: readonly T[], seed: number, offset = 0): T {
  if (items.length === 0) {
    throw new Error("Cannot pick from empty array");
  }
  const index = Math.abs(seed * 31 + offset * 17) % items.length;
  return items[index];
}

export function seededMany<T>(items: readonly T[], seed: number, count: number): T[] {
  const selected: T[] = [];
  for (let idx = 0; idx < count; idx += 1) {
    selected.push(seededPick(items, seed + idx * 13, idx));
  }
  return selected;
}

export function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function contextSnippet(context: AlbumContext): string {
  return cleanText(
    [
      context.title && `album ${context.title}`,
      context.premise && `premise: ${context.premise}`,
      context.themes && `themes: ${context.themes}`,
      context.visualMotifs && `visual motifs: ${context.visualMotifs}`,
      context.tone && `tone: ${context.tone}`,
      context.references && `references: ${context.references}`,
      context.styleNotes && `style: ${context.styleNotes}`,
    ]
      .filter(Boolean)
      .join(" | "),
  );
}

export function createIdeaId(prefix: "lyric" | "cover" | "saved", seed: number): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.abs(seed).toString(36)}`;
}

export function buildSourcePrompt(settings: GeneratorSettings | CoverGeneratorSettings): string {
  const entries = Object.entries(settings)
    .map(([key, value]) => `${key}:${Array.isArray(value) ? value.join("/") : String(value)}`)
    .join(" | ");
  return cleanText(entries);
}

export function deriveTags(base: string[], fallback: string[] = []): string[] {
  return Array.from(new Set([...base, ...fallback].map((tag) => tag.trim()).filter(Boolean))).slice(
    0,
    8,
  );
}

export function copyLyricIdea(idea: LyricIdea, overrides?: Partial<LyricIdea>): LyricIdea {
  return {
    ...idea,
    ...overrides,
    id: overrides?.id ?? createIdeaId("lyric", Date.now()),
    createdAt: overrides?.createdAt ?? Date.now(),
  };
}
