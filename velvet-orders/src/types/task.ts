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
};

export type TaskPack = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  source: "built-in";
  tasks: Task[];
};

export type OnboardingPreferences = {
  category?: string | string[];
  publicLevel?: TaskPublicLevel | TaskPublicLevel[];
  time?: TaskTime | TaskTime[];
  mode?: TaskMode | TaskMode[];
  tone?: ToneProfile;
};
