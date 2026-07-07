export type ToneProfile =
  | "playful"
  | "strict"
  | "affirming"
  | "teasing"
  | "dominant-teasing";

export type ToneConfig = {
  controlLevel: number; // 1-5
  intensityLevel: number; // 1-5
  suggestivenessLevel: number; // 1-5
  usesDegradation: boolean;
  usesPraise: boolean;
  // CUSTOM EXTENSION POINT
  customFlavorKey?: string;
};

type TonePhrasePool = {
  openers: string[];
  midSentenceModifiers: string[];
  closers: string[];
};

export const defaultToneConfigs: Record<ToneProfile, ToneConfig> = {
  playful: {
    controlLevel: 2,
    intensityLevel: 2,
    suggestivenessLevel: 2,
    usesDegradation: false,
    usesPraise: true
  },
  strict: {
    controlLevel: 5,
    intensityLevel: 3,
    suggestivenessLevel: 1,
    usesDegradation: false,
    usesPraise: false
  },
  affirming: {
    controlLevel: 3,
    intensityLevel: 2,
    suggestivenessLevel: 1,
    usesDegradation: false,
    usesPraise: true
  },
  teasing: {
    controlLevel: 3,
    intensityLevel: 3,
    suggestivenessLevel: 3,
    usesDegradation: false,
    usesPraise: true
  },
  "dominant-teasing": {
    controlLevel: 5,
    intensityLevel: 4,
    suggestivenessLevel: 4,
    usesDegradation: false,
    usesPraise: false
  }
};

export const tonePhrases: Record<ToneProfile, TonePhrasePool> = {
  playful: {
    openers: [
      "Okay, let us make this fun.",
      "We are doing this with some energy today.",
      "Ready? Let us keep it light and sharp."
    ],
    midSentenceModifiers: [
      "with a little extra spark",
      "while keeping your rhythm",
      "and keep your momentum up"
    ],
    closers: ["Keep it moving.", "Make it clean and quick.", "No dragging your feet."]
  },
  strict: {
    openers: [
      "This gets done properly now.",
      "Follow the steps exactly.",
      "You are doing this with full focus."
    ],
    midSentenceModifiers: [
      "with zero shortcuts",
      "with complete precision",
      "without breaking sequence"
    ],
    closers: ["No deviations.", "Stay exact.", "Finish to standard."]
  },
  affirming: {
    openers: [
      "You have this, start steady.",
      "Take a breath and do it cleanly.",
      "You are capable of doing this well."
    ],
    midSentenceModifiers: [
      "with calm confidence",
      "at a strong, steady pace",
      "while trusting your process"
    ],
    closers: ["You are on track.", "Keep that quality.", "Finish strong."]
  },
  teasing: {
    openers: [
      "Let us see what you can actually do.",
      "Try to impress me with this one.",
      "Do not get sloppy now."
    ],
    midSentenceModifiers: [
      "if you can stay disciplined",
      "without losing your edge",
      "before your focus slips"
    ],
    closers: ["Prove it.", "No half effort.", "Show control all the way through."]
  },
  "dominant-teasing": {
    openers: [
      "Let us see if you can handle this properly.",
      "You are going to do this the right way today.",
      "Try to stay focused for once."
    ],
    midSentenceModifiers: [
      "without needing reminders",
      "like you mean it this time",
      "under control from start to finish"
    ],
    closers: ["No shortcuts.", "Stay with it the whole time.", "Do not half-do it."]
  }
};

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

function pickDeterministic<T>(items: T[], seedKey: string): T {
  return items[hashString(seedKey) % items.length];
}

function applyMidSentenceModifier(taskText: string, modifier: string): string {
  const trimmed = taskText.trim();
  if (!trimmed) {
    return modifier;
  }

  const punctuationMatch = /[.!?]$/.test(trimmed);
  if (punctuationMatch) {
    return `${trimmed} (${modifier})`;
  }

  return `${trimmed}, ${modifier}.`;
}

export function applyTone(taskText: string, tone: ToneProfile): string {
  const toneConfig = defaultToneConfigs[tone];
  const phrasePool = tonePhrases[tone];

  const opener = pickDeterministic(phrasePool.openers, `${tone}|open|${taskText}`);
  const closer = pickDeterministic(phrasePool.closers, `${tone}|close|${taskText}`);
  const modifier = pickDeterministic(
    phrasePool.midSentenceModifiers,
    `${tone}|mid|${taskText}`
  );

  const bodyText = applyMidSentenceModifier(taskText, modifier);

  // === CUSTOM FLAVOR INJECTION POINT ===
  // You can modify the finalText here to apply additional transformations,
  // alternate personas, or more personalized phrasing.
  // Keep this optional and isolated so the base system remains stable.
  let finalText = `${opener}\n\n${bodyText}\n\n${closer}`;

  // CUSTOM LOGIC HOOK
  if (toneConfig.customFlavorKey) {
    finalText = applyCustomFlavor(finalText, toneConfig.customFlavorKey);
  }

  return finalText;
}

export function applyCustomFlavor(text: string, key: string): string {
  // Placeholder for user-defined transformations
  // Example:
  // if (key === "my-private-mode") {
  //   return text + "\n\n[custom addition here]"
  // }
  void key;
  return text;
}
