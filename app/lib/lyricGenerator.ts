import type { AlbumContext, GeneratorSettings, LyricIdea, MoodOption, RhymeSchemeOption } from "@/app/types";
import { OUTPUT_BLUEPRINTS, DIRECTION_EXPLANATIONS, MOOD_PREFIXES, COMPLEXITY_PHRASES } from "@/app/lib/templates";
import {
  CONTRAST_PAIRS,
  DIRECTION_LABELS,
  INTERNAL_RHYME_FRAGMENTS,
  MEMORY_IMAGERY,
  METAPHOR_FRAGMENTS,
  MOOD_TONES,
  PERSPECTIVE_SHIFTS,
  RHYME_ENDINGS,
  TAG_BANK,
} from "@/app/lib/wordbanks";
import { buildSourcePrompt, cleanText, contextSnippet, createIdeaId, deriveTags, seededPick, splitList } from "@/app/lib/generator";

const RAW_BURST_DIRECTIONS = [
  { label: "Sincere Nostalgic", mood: "nostalgic" as MoodOption, angle: "heart-on-sleeve memory focus" },
  { label: "Funny Self-Aware", mood: "playful" as MoodOption, angle: "humor-led with honest undertones" },
  { label: "Darker Reflective", mood: "melancholic" as MoodOption, angle: "shadowed memory with accountability" },
  { label: "Punchline Heavy", mood: "aggressive" as MoodOption, angle: "quotable bars with rhythm emphasis" },
  { label: "Abstract Imagery", mood: "surreal" as MoodOption, angle: "symbolic scenes and metaphor fragments" },
];

function lineEndingForScheme(scheme: RhymeSchemeOption, lineIndex: number): string | undefined {
  if (scheme === "none" || scheme === "loose / freeform") {
    return undefined;
  }

  const patternMap: Record<string, Array<"a" | "b" | "c" | "d">> = {
    AABB: ["a", "a", "b", "b"],
    ABAB: ["a", "b", "a", "b"],
    AA: ["a", "a", "a", "a"],
    mixed: ["a", "b", "c", "a"],
    "internal rhyme": ["a", "a", "a", "a"],
  };

  const poolKey = patternMap[scheme]?.[lineIndex % 4] ?? "a";
  return seededPick(RHYME_ENDINGS[poolKey], lineIndex + 11);
}

function buildSingleLine(params: {
  settings: GeneratorSettings;
  directionLabel: string;
  angle: string;
  lineIndex: number;
  seed: number;
  contextHint: string;
  mood: MoodOption;
}): string {
  const { settings, directionLabel, angle, lineIndex, seed, contextHint, mood } = params;
  const moodPrefix = seededPick(MOOD_PREFIXES[mood], seed, lineIndex);
  const moodTone = seededPick(MOOD_TONES[mood], seed + 3, lineIndex);
  const imagery = seededPick(MEMORY_IMAGERY, seed + 5, lineIndex);
  const metaphor = seededPick(METAPHOR_FRAGMENTS, seed + 7, lineIndex);
  const perspective = seededPick(PERSPECTIVE_SHIFTS, seed + 9, lineIndex);
  const contrast = seededPick(CONTRAST_PAIRS, seed + 12, lineIndex);
  const complexityLine = seededPick(COMPLEXITY_PHRASES[settings.complexity], seed + 18, lineIndex);
  const ending = lineEndingForScheme(settings.rhymeScheme, lineIndex);
  const keyword = settings.keywords.length
    ? seededPick(settings.keywords, seed + 20, lineIndex)
    : seededPick(splitList(settings.topic || "identity, memory"), seed + 22, lineIndex);
  const internalRhyme =
    settings.rhymeScheme === "internal rhyme" || settings.rhymeScheme === "mixed"
      ? `, ${seededPick(INTERNAL_RHYME_FRAGMENTS, seed + 24, lineIndex)}`
      : "";

  return cleanText(
    `${moodPrefix}, ${settings.topic} in ${directionLabel.toLowerCase()} mode: ${imagery}; ${metaphor}; ${angle}; ${perspective}; ${complexityLine}; ${contrast[0]} turning into ${contrast[1]} around "${keyword}" with a ${moodTone} cadence${internalRhyme}${contextHint ? `, threaded to ${contextHint}` : ""}${ending ? `, ending on ${ending}` : ""}.`,
  );
}

function buildIdeaText(settings: GeneratorSettings, directionLabel: string, angle: string, mood: MoodOption, index: number, contextHint: string): string {
  const blueprint = OUTPUT_BLUEPRINTS[settings.outputType];
  const lines = Array.from({ length: blueprint.lines }).map((_, lineIndex) =>
    buildSingleLine({
      settings,
      directionLabel,
      angle,
      lineIndex,
      seed: settings.variationSeed + index * 19,
      contextHint,
      mood,
    }),
  );

  if (settings.outputType === "title ideas") {
    const titleSource = lines[0]
      .split(";")
      .slice(0, 2)
      .map((piece) => piece.replace(/[".]/g, "").trim())
      .join(" // ");
    return cleanText(titleSource).slice(0, 100);
  }

  return lines.join("\n");
}

function buildLyricCard(params: {
  settings: GeneratorSettings;
  directionLabel: string;
  angle: string;
  mood: MoodOption;
  index: number;
  context: AlbumContext;
  parentId?: string;
}): LyricIdea {
  const { settings, directionLabel, angle, mood, index, context, parentId } = params;
  const contextHint = settings.useAlbumContext ? contextSnippet(context) : "";
  const tags = deriveTags(
    [
      mood,
      settings.outputType,
      settings.complexity,
      settings.rhymeScheme,
      ...settings.keywords.slice(0, 3),
      ...splitList(context.themes).slice(0, 2),
    ],
    TAG_BANK.slice(index, index + 2),
  );

  return {
    id: createIdeaId("lyric", settings.variationSeed + index),
    text: buildIdeaText(settings, directionLabel, angle, mood, index, contextHint),
    type: settings.outputType,
    mood,
    topic: settings.topic,
    rhymeScheme: settings.rhymeScheme,
    directionLabel,
    explanation: seededPick(DIRECTION_EXPLANATIONS, settings.variationSeed, index),
    tags,
    rhymeLabel: settings.rhymeScheme === "none" ? undefined : settings.rhymeScheme,
    sourcePrompt: buildSourcePrompt(settings),
    createdAt: Date.now(),
    favorite: false,
    parentId,
  };
}

export function generateLyricIdeas(settings: GeneratorSettings, context: AlbumContext): LyricIdea[] {
  const basisTopic = settings.topic.trim() || "identity under pressure";
  const normalizedSettings: GeneratorSettings = {
    ...settings,
    topic: basisTopic,
  };

  return Array.from({ length: 5 }).map((_, index) => {
    const directionLabel = seededPick(DIRECTION_LABELS, normalizedSettings.variationSeed + 1, index);
    const angle = seededPick(
      [
        "nostalgia colliding with present tension",
        "ironic humor masking sincere vulnerability",
        "scene-by-scene storytelling with character detail",
        "punchline pivots with emotional residue",
        "symbolic writing over literal exposition",
      ],
      normalizedSettings.variationSeed + 2,
      index,
    );
    return buildLyricCard({
      settings: normalizedSettings,
      directionLabel,
      angle,
      mood: normalizedSettings.mood,
      index,
      context,
    });
  });
}

export function generateRawIdeaBurst(settings: GeneratorSettings, context: AlbumContext): LyricIdea[] {
  const basisTopic = settings.topic.trim() || "growing up between jokes and pressure";
  return RAW_BURST_DIRECTIONS.map((direction, index) =>
    buildLyricCard({
      settings: { ...settings, topic: basisTopic, mood: direction.mood },
      directionLabel: direction.label,
      angle: direction.angle,
      mood: direction.mood,
      index,
      context,
    }),
  );
}
