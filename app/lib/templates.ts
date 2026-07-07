import type { ComplexityOption, LyricOutputType, MoodOption } from "@/app/types";

export const MOOD_PREFIXES: Record<MoodOption, string[]> = {
  nostalgic: ["back then", "in rewind mode", "from the old tape"],
  reflective: ["when I check myself", "in plain honesty", "without the gloss"],
  aggressive: ["steel-jaw energy", "no soft focus", "all pressure applied"],
  playful: ["with a side-eye grin", "cartoon timing on", "jokes first, then truth"],
  melancholic: ["under dim hallway lights", "in the late-hour echo", "with rain on the frame"],
  triumphant: ["with both hands up", "on the comeback arc", "from underdog to headline"],
  cinematic: ["in a widescreen cut", "like a final scene", "over swelling drums"],
  surreal: ["inside a bent dream", "in impossible physics", "where symbols talk back"],
};

export const COMPLEXITY_PHRASES: Record<ComplexityOption, string[]> = {
  simple: ["plain words, clear image", "direct line, easy stick"],
  layered: ["double meaning in one breath", "surface joke, deeper bruise"],
  abstract: ["symbol over statement", "impressionistic frame shift"],
  direct: ["no metaphor shield", "straight hit, no detour"],
};

export const DIRECTION_EXPLANATIONS = [
  "Leans into scene-setting details with a clear emotional angle.",
  "Uses contrast between humor and vulnerability for replay value.",
  "Pushes visual memory fragments while keeping a tight rhythmic spine.",
  "Builds a quotable line then anchors it with lived-in texture.",
  "Turns the topic into symbolic images that still feel grounded.",
  "Stays conversational and personal so the line feels believable.",
];

export const OUTPUT_BLUEPRINTS: Record<LyricOutputType, { lines: number; label: string }> = {
  "single lines": { lines: 1, label: "Single-line spark" },
  couplets: { lines: 2, label: "Couplet pivot" },
  "4-bar ideas": { lines: 4, label: "Four-bar scene" },
  punchlines: { lines: 1, label: "Punchline frame" },
  hooks: { lines: 2, label: "Hook skeleton" },
  "title ideas": { lines: 1, label: "Title candidate" },
};

export const REDIRECT_MODES = [
  "more emotional",
  "more ironic",
  "fit album tighter",
  "more grounded",
  "more visual",
  "more rhythmic",
];

export const REFRAME_MODES = [
  "funny-to-serious",
  "personal-to-universal",
  "direct-to-symbolic",
  "present-to-memory",
  "brag-to-confession",
];

export const COVER_MOOD_ADJUSTMENTS = {
  darker: "drop brightness, increase shadow contrast",
  simpler: "reduce clutter to one symbolic focal point",
  surreal: "bend perspective and distort scale",
  nostalgic: "increase period texture and analog artifacts",
  "fit-theme": "prioritize symbols and colors from album context",
} as const;
