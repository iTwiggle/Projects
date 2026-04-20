import type {
  AlbumContext,
  CoverConcept,
  CoverGeneratorSettings,
  CoverTransformMode,
  GeneratorSettings,
  IdeaTransformMode,
  LyricIdea,
} from "@/app/types";
import { COVER_MOOD_ADJUSTMENTS, REDIRECT_MODES, REFRAME_MODES } from "@/app/lib/templates";
import { generateCoverConcepts } from "@/app/lib/coverConceptGenerator";
import { copyLyricIdea, createIdeaId, seededPick, splitList } from "@/app/lib/generator";
import { generateLyricIdeas } from "@/app/lib/lyricGenerator";
import { COLOR_PALETTES, COVER_SYMBOLS, MEMORY_IMAGERY } from "@/app/lib/wordbanks";

function mutateText(text: string, modeLabel: string, seed: number): string {
  const fragments = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (fragments.length === 0) {
    return `${modeLabel}: reworked idea`;
  }

  const selected = fragments.map((line, index) => {
    const imagery = seededPick(MEMORY_IMAGERY, seed + 5, index);
    return `${line} (${modeLabel}; image pivot: ${imagery})`;
  });
  return selected.join("\n");
}

export function recreateIdea(
  idea: LyricIdea,
  settings: GeneratorSettings,
  context: AlbumContext,
): LyricIdea {
  const [candidate] = generateLyricIdeas(
    { ...settings, topic: idea.topic, variationSeed: settings.variationSeed + 17 },
    context,
  );
  return copyLyricIdea(candidate ?? idea, {
    id: createIdeaId("lyric", settings.variationSeed + 100),
    directionLabel: `Recreated: ${idea.directionLabel}`,
    parentId: idea.id,
  });
}

export function reframeIdea(idea: LyricIdea, mode: IdeaTransformMode, seed: number): LyricIdea {
  const shift = mode === "reframe" ? seededPick(REFRAME_MODES, seed) : "perspective shift";
  return copyLyricIdea(idea, {
    id: createIdeaId("lyric", seed + 101),
    text: mutateText(idea.text, `reframed as ${shift}`, seed),
    directionLabel: `Reframed (${shift})`,
    explanation: "Perspective and narrative stance shifted while preserving the core seed.",
    parentId: idea.id,
  });
}

export function redirectIdea(idea: LyricIdea, seed: number): LyricIdea {
  const redirectMode = seededPick(REDIRECT_MODES, seed);
  return copyLyricIdea(idea, {
    id: createIdeaId("lyric", seed + 102),
    text: mutateText(idea.text, `redirected toward ${redirectMode}`, seed),
    directionLabel: `Redirected (${redirectMode})`,
    explanation: "Core seed kept, but the trajectory shifts to a new emotional or stylistic lane.",
    parentId: idea.id,
  });
}

export function fitIdeaToAlbumTheme(idea: LyricIdea, context: AlbumContext, seed: number): LyricIdea {
  const themes = splitList(context.themes).slice(0, 3);
  const motifs = splitList(context.visualMotifs).slice(0, 2);
  const tone = context.tone || "album tone";
  const appended = [
    idea.text,
    `Theme lock: tie this to ${themes.join(", ") || "core album themes"}, motif cues ${motifs.join(", ") || "signature visuals"}, tone ${tone}.`,
  ].join("\n");

  return copyLyricIdea(idea, {
    id: createIdeaId("lyric", seed + 103),
    text: appended,
    tags: Array.from(new Set([...idea.tags, ...themes, ...motifs])).slice(0, 8),
    directionLabel: "Fit Album Theme Better",
    explanation: "Rephrased to align with stored album premise, themes, and motifs.",
    parentId: idea.id,
  });
}

export function extrapolateThemeIdeas(idea: LyricIdea, context: AlbumContext, seed: number): LyricIdea[] {
  return Array.from({ length: 4 }).map((_, index) => {
    const thematicObject = seededPick(
      [...splitList(context.themes), ...MEMORY_IMAGERY, "identity loop"],
      seed + index * 11,
      index,
    );
    return copyLyricIdea(idea, {
      id: createIdeaId("lyric", seed + 200 + index),
      text: `${idea.text}\nSequel ${index + 1}: extend this into a companion bar around "${thematicObject}" with a fresh punchline landing.`,
      directionLabel: `Extrapolated Theme ${index + 1}`,
      explanation: "Derived adjacent companion bars from the same seed concept.",
      parentId: idea.id,
    });
  });
}

export function transformLyricIdea(
  idea: LyricIdea,
  mode: IdeaTransformMode,
  settings: GeneratorSettings,
  context: AlbumContext,
  seed: number,
): LyricIdea | LyricIdea[] {
  if (mode === "recreate") {
    return recreateIdea(idea, settings, context);
  }
  if (mode === "reframe") {
    return reframeIdea(idea, mode, seed);
  }
  if (mode === "redirect" || mode === "darker" || mode === "funnier" || mode === "personal") {
    return redirectIdea(
      copyLyricIdea(idea, {
        text: mutateText(idea.text, mode, seed + 12),
      }),
      seed + 20,
    );
  }
  if (mode === "fit-theme") {
    return fitIdeaToAlbumTheme(idea, context, seed);
  }
  return extrapolateThemeIdeas(idea, context, seed);
}

function applyCoverMode(cover: CoverConcept, mode: CoverTransformMode, seed: number): CoverConcept {
  const adjustment =
    mode in COVER_MOOD_ADJUSTMENTS
      ? COVER_MOOD_ADJUSTMENTS[mode as keyof typeof COVER_MOOD_ADJUSTMENTS]
      : "reframe concept";
  const color = seededPick(COLOR_PALETTES, seed + 4);
  const symbol = seededPick(COVER_SYMBOLS, seed + 8);

  return {
    ...cover,
    id: createIdeaId("cover", seed),
    title: `${cover.title} (${mode})`,
    description: `${cover.description} Adjustment: ${adjustment}.`,
    colors: Array.from(new Set([...cover.colors, ...color.split(",").map((chunk) => chunk.trim())])).slice(
      0,
      5,
    ),
    symbols: Array.from(new Set([...cover.symbols, symbol])).slice(0, 5),
    artPrompt: `${cover.artPrompt}. Modifier: ${adjustment}.`,
    favorite: false,
    createdAt: Date.now(),
    parentId: cover.id,
  };
}

export function recreateCoverConcept(
  concept: CoverConcept,
  settings: CoverGeneratorSettings,
  context: AlbumContext,
): CoverConcept {
  const [candidate] = generateCoverConcepts(
    {
      ...settings,
      albumName: settings.albumName || context.title || "Untitled Project",
      variationSeed: settings.variationSeed + 15,
    },
    context,
  );
  return {
    ...(candidate ?? concept),
    id: createIdeaId("cover", settings.variationSeed + 301),
    title: `Recreated: ${(candidate ?? concept).title}`,
    parentId: concept.id,
  };
}

export function reframeCoverConcept(concept: CoverConcept, mode: CoverTransformMode, seed: number): CoverConcept {
  return applyCoverMode(concept, mode, seed + 302);
}

export function transformCoverConcept(
  concept: CoverConcept,
  mode: CoverTransformMode,
  settings: CoverGeneratorSettings,
  context: AlbumContext,
  seed: number,
): CoverConcept {
  if (mode === "recreate") {
    return recreateCoverConcept(concept, settings, context);
  }
  return reframeCoverConcept(concept, mode, seed);
}
