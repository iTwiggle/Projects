import type {
  OnboardingPreferences,
  ProgressionState,
  ToneProfile,
} from "@/types/task";

type TonePhraseSet = {
  openers: string[];
  closers: string[];
  statusPhrases?: string[];
  rewardPhrases?: string[];
};

const DEFAULT_TONE: ToneProfile = "affirming";

const TONE_PHRASES: Record<ToneProfile, TonePhraseSet> = {
  playful: {
    openers: [
      "Alright, bright one, here we go.",
      "Cute focus, now prove it.",
      "Let us make this one a little fun.",
      "Play time with purpose starts now.",
    ],
    closers: [
      "Keep the spark, finish clean.",
      "Do it with a grin and a spine.",
      "Light hands, steady follow-through.",
      "Make it smooth, not sloppy.",
    ],
    statusPhrases: [
      "Mischief level: calibrated.",
      "Warm tone, clear standards.",
      "Playful, not careless.",
    ],
    rewardPhrases: [
      "Good sparkle. Keep going.",
      "Nicely done, darling.",
      "That was tidy and bright.",
    ],
  },
  strict: {
    openers: [
      "Focus now.",
      "Proceed with precision.",
      "No drift. Execute.",
      "Clear task. Clean action.",
    ],
    closers: [
      "Report complete when done.",
      "Hold standard until finished.",
      "No shortcuts.",
      "Finish exactly as directed.",
    ],
    statusPhrases: [
      "Directive mode active.",
      "Composure and compliance.",
      "Standards over excuses.",
    ],
    rewardPhrases: [
      "Accepted. Continue.",
      "Good control.",
      "Execution meets standard.",
    ],
  },
  affirming: {
    openers: [
      "You are steady; start here.",
      "Take a breath, then begin.",
      "You can do this well.",
      "Ground yourself and move forward.",
    ],
    closers: [
      "You are building real momentum.",
      "One clean step is enough for now.",
      "Keep this pace; it is working.",
      "Your consistency is the win.",
    ],
    statusPhrases: [
      "Supportive tone active.",
      "Steady effort matters most.",
      "Calm confidence, one step at a time.",
    ],
    rewardPhrases: [
      "That was solid work.",
      "Beautiful follow-through.",
      "You handled that with care.",
    ],
  },
  teasing: {
    openers: [
      "Let us see if you can hold your edge.",
      "Show me your discipline, sweetheart.",
      "You want approval? Earn it.",
      "I am watching your consistency.",
    ],
    closers: [
      "Do it properly, not performatively.",
      "Make me notice your control.",
      "Keep it elegant under pressure.",
      "Precision looks good on you.",
    ],
    statusPhrases: [
      "Evaluative warmth engaged.",
      "Provocative, but grounded.",
      "Measured pressure applied.",
    ],
    rewardPhrases: [
      "Mm. Better.",
      "That is the standard I expected.",
      "Good. Stay in that posture.",
    ],
  },
  "dominant-teasing": {
    openers: [
      "Listen carefully and execute.",
      "You are here to follow through, not negotiate.",
      "Hold your composure and obey the frame.",
      "You will do this with control and intent.",
    ],
    closers: [
      "You are done when it is exact.",
      "I expect clean compliance.",
      "No wobble. Finish with discipline.",
      "Deliver the result, then hold steady.",
    ],
    statusPhrases: [
      "Control-forward mode active.",
      "High accountability, low drama.",
      "Evaluative frame in effect.",
    ],
    rewardPhrases: [
      "Good. That is obedience in action.",
      "Accepted. Maintain this standard.",
      "Yes. Controlled and complete.",
    ],
  },
};

const VALID_TONES: ToneProfile[] = [
  "playful",
  "strict",
  "affirming",
  "teasing",
  "dominant-teasing",
];

const PROGRESSION_TONE_OVERRIDES: Record<
  ProgressionState,
  { opener?: string[]; closer?: string[] }
> = {
  "warming-up": {
    opener: ["Start gently."],
    closer: ["Settle in and keep it simple."],
  },
  steady: {
    opener: ["You know the rhythm."],
    closer: ["Keep this line steady."],
  },
  "locked-in": {
    opener: ["Strong form. Keep it exact."],
    closer: ["Maintain that standard."],
  },
  slipping: {
    opener: ["Reset now."],
    closer: ["Tighten up and complete it cleanly."],
  },
};

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function hashSeed(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickFromPool(pool: string[], seed: string): string {
  const idx = hashSeed(seed) % pool.length;
  return pool[idx] ?? pool[0];
}

function isToneProfile(value: string): value is ToneProfile {
  return VALID_TONES.includes(value as ToneProfile);
}

export function resolveToneFromPreferences(
  preferences: OnboardingPreferences | null,
): ToneProfile {
  if (preferences?.tone && isToneProfile(preferences.tone)) {
    return preferences.tone;
  }

  const selected = asArray(preferences?.mode);
  const firstValid = selected.find((mode) => isToneProfile(mode));
  return firstValid ?? DEFAULT_TONE;
}

export function applyTone(
  taskText: string,
  tone: ToneProfile,
  progression?: ProgressionState,
): string {
  const normalizedTask = taskText.trim();
  if (!normalizedTask) {
    return taskText;
  }

  const phrases = TONE_PHRASES[tone];
  const override = progression ? PROGRESSION_TONE_OVERRIDES[progression] : undefined;
  const openerPool = [...(phrases.openers ?? []), ...(override?.opener ?? [])];
  const closerPool = [...(phrases.closers ?? []), ...(override?.closer ?? [])];
  const opener = pickFromPool(openerPool, `${tone}:${progression ?? "none"}:${normalizedTask}:open`);
  const closer = pickFromPool(closerPool, `${tone}:${progression ?? "none"}:${normalizedTask}:close`);
  return `${opener} ${normalizedTask} ${closer}`;
}

export function getToneStatusPhrase(tone: ToneProfile): string | null {
  const pool = TONE_PHRASES[tone].statusPhrases;
  if (!pool || pool.length === 0) {
    return null;
  }
  return pickFromPool(pool, `${tone}:status`);
}

export function getToneRewardPhrase(tone: ToneProfile): string | null {
  const pool = TONE_PHRASES[tone].rewardPhrases;
  if (!pool || pool.length === 0) {
    return null;
  }
  return pickFromPool(pool, `${tone}:reward`);
}

export const customFlavorKey = "velvet-orders:custom-flavor";

// Placeholder for future custom style layering, intentionally no-op for now.
export function applyCustomFlavor(
  text: string,
  customFlavor?: string | null,
): string {
  void customFlavor;
  return text;
}

