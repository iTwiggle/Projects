export type TaskPublicLevel = "private" | "subtle" | "public";

export type TaskTime = "quick" | "normal" | "long";

export type ToneProfile =
  | "playful"
  | "strict"
  | "affirming"
  | "teasing"
  | "dominant-teasing";

export type ProgressionState =
  | "warming-up"
  | "steady"
  | "locked-in"
  | "slipping";

export type TaskMode = ToneProfile;

export type Task = {
  id: string;
  title: string;
  category: string;
  intensity: number;
  publicLevel: TaskPublicLevel;
  time: TaskTime;
  modes: TaskMode[];
  text: string;
  completionText?: string;
  tags?: string[];
  // Future private extension point for per-task flavoring.
  customFlavorKey?: string;
  // Future private extension point for owner-only notes.
  privateNotes?: string;
};

export type TaskPack = {
  id: string;
  name: string;
  description?: string;
  version?: string;
  enabled: boolean;
  source: "built-in" | "imported" | "custom";
  // Future private extension point for pack-level presentation flavoring.
  flavorProfile?: string;
  tasks: Task[];
};

export type TaskWithPackMeta = Task & {
  packId: string;
  packName: string;
  packSource: TaskPack["source"];
};

export type OnboardingPreferences = {
  category?: string | string[];
  publicLevel?: TaskPublicLevel | TaskPublicLevel[];
  time?: TaskTime | TaskTime[];
  mode?: TaskMode | TaskMode[];
  tone?: ToneProfile;
};

export type TaskScoreBreakdown = {
  baseScore: number;
  preferredCategoryBonus: number;
  intensityFitBonus: number;
  recentCompletionBonus: number;
  rerollPenalty: number;
  skipPenalty: number;
  repetitionPenalty: number;
  proofBonus: number;
  finalScore: number;
};

export type AdaptiveScoredCandidate = {
  taskId: string;
  title: string;
  category: string;
  intensity: number;
  packId: string;
  packName: string;
  packSource: TaskPack["source"];
  finalScore: number;
  breakdown: TaskScoreBreakdown;
};

export type AdaptivePickResult = {
  selectedTask: TaskWithPackMeta | null;
  targetIntensity: number;
  intensityAdjustment: number;
  eligibleCount: number;
  topPoolSize: number;
  signals: {
    completed: number;
    rerolled: number;
    skipped: number;
    proofProvided: number;
    streak: number;
    total: number;
  };
  candidates: AdaptiveScoredCandidate[];
};
