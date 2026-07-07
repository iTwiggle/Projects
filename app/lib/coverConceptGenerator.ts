import type { AlbumContext, CoverConcept, CoverGeneratorSettings } from "@/app/types";
import { COVER_MOOD_ADJUSTMENTS } from "@/app/lib/templates";
import { buildSourcePrompt, contextSnippet, createIdeaId, seededMany, seededPick, splitList } from "@/app/lib/generator";
import { COLOR_PALETTES, COVER_COMPOSITIONS, COVER_SYMBOLS, COVER_TITLES, MOOD_TONES } from "@/app/lib/wordbanks";

function buildCoverDescription(
  title: string,
  settings: CoverGeneratorSettings,
  context: AlbumContext,
  index: number,
): string {
  const tone = seededPick(MOOD_TONES[settings.mood], settings.variationSeed + 3, index);
  const motif = seededPick(
    [...settings.visualMotifs, ...splitList(context.visualMotifs), ...COVER_SYMBOLS],
    settings.variationSeed + 7,
    index,
  );
  const reference = seededPick(
    [...splitList(settings.references), ...splitList(context.references), "analog texture"],
    settings.variationSeed + 9,
    index,
  );
  const palette = seededPick(
    [settings.colorPalette, ...splitList(context.keywords), ...COLOR_PALETTES],
    settings.variationSeed + 11,
    index,
  );
  const contextLine = settings.useAlbumContext && context.title ? `for album ${context.title}` : "as standalone era piece";

  return `${title} frames ${motif} in a ${tone} visual lane ${contextLine}. The scene uses ${reference} details and a palette built around ${palette}. Keep the composition bold but human, with texture that suggests memory instead of polished futurism.`;
}

export function generateCoverConcepts(
  settings: CoverGeneratorSettings,
  context: AlbumContext,
): CoverConcept[] {
  const projectName = settings.albumName || context.title || "Untitled Project";
  const titles = seededMany(COVER_TITLES, settings.variationSeed + 21, 5);

  return titles.map((baseTitle, index) => {
    const colors = seededMany(COLOR_PALETTES, settings.variationSeed + index * 5, 2)
      .flatMap((palette) => palette.split(",").map((color) => color.trim()))
      .slice(0, 4);
    const symbols = seededMany(
      [...settings.visualMotifs, ...splitList(context.visualMotifs), ...COVER_SYMBOLS].filter(Boolean),
      settings.variationSeed + index * 7,
      3,
    );
    const composition = seededPick(COVER_COMPOSITIONS, settings.variationSeed + 13, index);
    const moodTags = [settings.mood, ...splitList(settings.theme), ...splitList(context.tone)].slice(0, 4);
    const description = buildCoverDescription(baseTitle, settings, context, index);
    const contextHint = settings.useAlbumContext ? contextSnippet(context) : "";

    return {
      id: createIdeaId("cover", settings.variationSeed + index),
      title: baseTitle,
      description,
      colors: Array.from(new Set(colors)),
      symbols: Array.from(new Set(symbols)),
      composition,
      moodTags: Array.from(new Set(moodTags)),
      artPrompt: `Album cover concept for "${projectName}", title "${baseTitle}", ${description} Composition: ${composition}. Symbols: ${symbols.join(", ")}. Colors: ${colors.join(", ")}.${contextHint ? ` Context: ${contextHint}.` : ""}`,
      createdAt: Date.now(),
      favorite: false,
      sourcePrompt: buildSourcePrompt(settings),
    };
  });
}

export function coverConceptModeLabel(mode: keyof typeof COVER_MOOD_ADJUSTMENTS): string {
  return COVER_MOOD_ADJUSTMENTS[mode];
}
