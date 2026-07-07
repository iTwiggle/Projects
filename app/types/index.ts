export type MoodOption =
  | "nostalgic"
  | "reflective"
  | "aggressive"
  | "playful"
  | "melancholic"
  | "triumphant"
  | "cinematic"
  | "surreal";

export type RhymeSchemeOption =
  | "none"
  | "AABB"
  | "ABAB"
  | "AA"
  | "internal rhyme"
  | "mixed"
  | "loose / freeform";

export type LyricOutputType =
  | "single lines"
  | "couplets"
  | "4-bar ideas"
  | "punchlines"
  | "hooks"
  | "title ideas";

export type ComplexityOption = "simple" | "layered" | "abstract" | "direct";

export type IdeaTransformMode =
  | "recreate"
  | "reframe"
  | "redirect"
  | "fit-theme"
  | "darker"
  | "funnier"
  | "personal"
  | "extrapolate";

export type CoverTransformMode =
  | "recreate"
  | "reframe"
  | "redirect"
  | "fit-theme"
  | "darker"
  | "simpler"
  | "surreal"
  | "nostalgic";

export interface AlbumContext {
  title: string;
  premise: string;
  themes: string;
  tone: string;
  references: string;
  visualMotifs: string;
  keywords: string;
  avoid: string;
  styleNotes: string;
}

export interface GeneratorSettings {
  topic: string;
  mood: MoodOption;
  styleCadence: string;
  keywords: string[];
  rhymeScheme: RhymeSchemeOption;
  outputType: LyricOutputType;
  complexity: ComplexityOption;
  useAlbumContext: boolean;
  variationSeed: number;
}

export interface CoverGeneratorSettings {
  albumName: string;
  theme: string;
  mood: MoodOption;
  visualMotifs: string[];
  colorPalette: string;
  references: string;
  useAlbumContext: boolean;
  variationSeed: number;
}

export interface LyricIdea {
  id: string;
  text: string;
  type: LyricOutputType;
  mood: MoodOption;
  topic: string;
  rhymeScheme: RhymeSchemeOption;
  directionLabel: string;
  explanation: string;
  tags: string[];
  rhymeLabel?: string;
  sourcePrompt: string;
  createdAt: number;
  favorite: boolean;
  parentId?: string;
}

export interface CoverConcept {
  id: string;
  title: string;
  description: string;
  colors: string[];
  symbols: string[];
  composition: string;
  moodTags: string[];
  artPrompt: string;
  createdAt: number;
  favorite: boolean;
  sourcePrompt: string;
  parentId?: string;
}

export type SavedIdeaType = "lyrics" | "cover concepts" | "titles" | "hooks";

export interface SavedIdea {
  id: string;
  type: SavedIdeaType;
  content: string;
  sourcePrompt: string;
  tags: string[];
  timestamp: number;
  favorite: boolean;
  parentIdeaId?: string;
  lyricIdea?: LyricIdea;
  coverConcept?: CoverConcept;
}

export interface SelectedCardState {
  id: string;
  cardType: "lyric" | "cover";
}

export const DEFAULT_ALBUM_CONTEXT: AlbumContext = {
  title: "",
  premise: "",
  themes: "",
  tone: "",
  references: "",
  visualMotifs: "",
  keywords: "",
  avoid: "",
  styleNotes: "",
};

export const DEFAULT_GENERATOR_SETTINGS: GeneratorSettings = {
  topic: "",
  mood: "nostalgic",
  styleCadence: "story-driven with internal pivots",
  keywords: [],
  rhymeScheme: "mixed",
  outputType: "single lines",
  complexity: "layered",
  useAlbumContext: true,
  variationSeed: 1,
};

export const DEFAULT_COVER_SETTINGS: CoverGeneratorSettings = {
  albumName: "",
  theme: "",
  mood: "cinematic",
  visualMotifs: [],
  colorPalette: "CRT neon + washed suburban pastels",
  references: "",
  useAlbumContext: true,
  variationSeed: 1,
};
