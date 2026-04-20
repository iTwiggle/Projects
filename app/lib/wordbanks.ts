import type { MoodOption } from "@/app/types";

export const MOOD_TONES: Record<MoodOption, string[]> = {
  nostalgic: ["warm", "faded", "hazy", "cassette-soft", "memory-lit"],
  reflective: ["honest", "measured", "quiet", "self-checking", "grown"],
  aggressive: ["sharp", "punchy", "unflinching", "charged", "heavy-step"],
  playful: ["witty", "bouncy", "cheeky", "cartoon-fast", "left-field"],
  melancholic: ["blue-hour", "weighty", "late-night", "aching", "fogged"],
  triumphant: ["uplifted", "victory-laced", "wide-screen", "upward", "bold"],
  cinematic: ["scope-heavy", "scene-built", "slow-pan", "soundtrack-ready", "grand"],
  surreal: ["dream-cut", "warped", "symbolic", "gravity-bent", "mythic"],
};

export const DIRECTION_LABELS = [
  "Sincere Nostalgia",
  "Funny + Self-Aware",
  "Darker Reflection",
  "Punchline Stack",
  "Abstract Imagery",
  "Grounded Storytelling",
  "Ironic Social Lens",
  "Memory Montage",
];

export const PERSPECTIVE_SHIFTS = [
  "first person confession",
  "street-corner narrator",
  "older self looking back",
  "you-as-listener direct address",
  "camera-eye objective detail",
  "inside-joke voice note",
];

export const CONTRAST_PAIRS = [
  ["jokes", "jaw-clenched truth"],
  ["golden glow", "fluorescent loneliness"],
  ["victory lap", "imposter echoes"],
  ["childhood wonder", "adult static"],
  ["clean sneakers", "messy conscience"],
  ["bright hook", "dark verse"],
] as const;

export const MEMORY_IMAGERY = [
  "CRT glow on knuckles",
  "VHS grain across the ceiling",
  "checkerboard hallway at dusk",
  "off-brand cereal prize ring",
  "suburban court with cracked paint",
  "cartoon static in the background",
  "school bus windows fogged by winter breath",
  "pager beep in a quiet bedroom",
  "half-erased cassette label",
  "faded mall tile reflections",
];

export const METAPHOR_FRAGMENTS = [
  "memory like a scratched disc",
  "my confidence wore hand-me-down armor",
  "dreams parked beside a laundromat light",
  "my laugh was a smoke screen for panic",
  "time flipped channels without warning",
  "the ego moved like a paper crown in rain",
  "grief sat passenger with the seat leaned back",
  "hope kicked drums in a dim basement",
];

export const INTERNAL_RHYME_FRAGMENTS = [
  "glass mask / backtrack",
  "night shift / light flick",
  "cold code / old road",
  "headspace / dead weight",
  "daydream / tape hiss",
  "main stage / page rage",
];

export const RHYME_ENDINGS: Record<string, string[]> = {
  a: ["glow", "show", "below", "retro", "echo", "slow"],
  b: ["night", "light", "byte", "height", "kite", "white"],
  c: ["frame", "name", "flame", "same", "game", "tape"],
  d: ["street", "beat", "heat", "seat", "repeat", "concrete"],
};

export const TAG_BANK = [
  "nostalgia",
  "identity",
  "humor",
  "alienation",
  "masculinity",
  "memory",
  "suburbia",
  "cartoon-static",
  "VHS",
  "self-reflection",
  "punchline",
  "imagery-heavy",
];

export const COVER_TITLES = [
  "CRT Ghost Bedroom",
  "Checkerboard Suburbia",
  "Cartoon Static Halo",
  "Neon Hallway Replay",
  "Backseat Memory Tape",
  "Motel Sign Reverie",
  "Basement Trophy Dreams",
  "Moonlit Food Court",
];

export const COVER_COMPOSITIONS = [
  "single subject centered with layered texture background",
  "wide suburban frame with one symbolic foreground object",
  "top-down bedroom layout with clustered nostalgic artifacts",
  "street-level perspective with heavy negative space",
  "double exposure portrait + environment collage",
  "triptych panel treatment showing past / present / distortion",
];

export const COVER_SYMBOLS = [
  "CRT television",
  "checkerboard floor",
  "disposable camera",
  "baseball card stack",
  "bus transfer ticket",
  "cassette player",
  "hoodie on desk chair",
  "streetlight halo",
  "spiral notebook",
  "arcade token",
];

export const COLOR_PALETTES = [
  "phosphor green, smoke black, violet haze",
  "faded denim blue, washed peach, warm cream",
  "amber streetlight, burgundy shadow, chrome gray",
  "neon cyan, magenta static, midnight navy",
  "dusty mint, checkerboard black/white, sunset coral",
];
