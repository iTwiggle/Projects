import {
  Concept,
  IdeaInput,
  MutationMode,
  ScoreDimension,
  ScoreMap,
} from "@/types/concept";

const scoreWeights: Record<ScoreDimension, number> = {
  originality: 0.16,
  profitability: 0.18,
  feasibility: 0.14,
  developmentTime: 0.08,
  maintenanceComplexity: 0.08,
  viralityPotential: 0.1,
  creatorEconomyAlignment: 0.08,
  aiDefensibility: 0.12,
  nicheStrength: 0.06,
};

const mutationRecipes: Record<MutationMode, string> = {
  remix: "Remixed with adjacent user behavior and stronger emotional hooks.",
  combine: "Combined with second concept to unlock a hybrid positioning strategy.",
  cursed: "Leans into a strange-but-compelling behavior loop with novelty bias.",
  profitable: "Prioritizes stronger monetization channels and premium workflows.",
  simpler: "Reduces scope to a sharper single-job product with fewer dependencies.",
  scalable: "Reorients architecture for repeatable onboarding and lower marginal cost.",
  pivotB2B: "Reframes as a team workflow tool with ROI-focused messaging.",
  pivotCreators:
    "Targets creator monetization workflows and distribution-friendly loops.",
  reduceMaintenance:
    "Shifts implementation toward low-ops integrations and constrained feature depth.",
  adjacent: "Moves into an adjacent market while preserving the core mechanic.",
};

const archetypes = [
  "Signal Lab",
  "Pattern Reactor",
  "Behavior Forge",
  "Feedback Loom",
  "Creator Kernel",
  "Tension Studio",
];

const aesthetics = [
  "Dark translucent panels with neon cyan score glows and thin data-grid overlays.",
  "Graphite command-surface with magenta accent traces and subtle animated scanlines.",
  "Obsidian cards with emerald edge-lighting, holographic chips, and precise typography.",
  "Midnight modular dock UI with layered blur, electric purple indicators, and motion-rich meters.",
];

const monetizationModes = [
  "Tiered subscription with advanced mutation depth on higher plans.",
  "Seat-based plan for teams plus premium strategy reports.",
  "Freemium with paid concept exports, score benchmarking, and private workspaces.",
  "Subscription plus usage-based credits for deeper mutation runs.",
];

const failurePatterns = [
  "The idea may collapse into novelty theater without consistent acquisition loops.",
  "Technical ambition can outrun retention if onboarding fails to show immediate value.",
  "A crowded adjacent category can blur differentiation if positioning is vague.",
  "Reliance on one channel can throttle growth if distribution costs increase.",
];

const hiddenOpportunityPatterns = [
  "Turn discarded concept variants into a searchable insight library and trend signal.",
  "Offer a creator playbook mode that translates ideas into weekly execution rituals.",
  "Bundle benchmark snapshots that show users where competitors ignore niche pain points.",
  "Package mutation history as investor-facing evidence of strategic thinking discipline.",
];

const mvpSlices = [
  "Guided input capture with niche-weight controls",
  "Generation of structured concept dossiers",
  "Mutation studio with outcome-based controls",
  "Comparative scoring and ranking dashboard",
  "Saved concept repository with tags and favorites",
];

function parseField(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function buildScoreMap(tokens: string[]): ScoreMap {
  const hasAutomation = tokens.some((token) =>
    ["automation", "workflow", "ops"].some((keyword) =>
      token.toLowerCase().includes(keyword),
    ),
  );
  const hasCreator = tokens.some((token) =>
    ["creator", "music", "video", "content", "stream"].some((keyword) =>
      token.toLowerCase().includes(keyword),
    ),
  );
  const hasDeepTech = tokens.some((token) =>
    ["ai", "security", "cyber", "ml"].some((keyword) =>
      token.toLowerCase().includes(keyword),
    ),
  );

  return {
    originality: clamp(64 + Math.random() * 26),
    profitability: clamp(58 + (hasAutomation ? 14 : 0) + Math.random() * 18),
    feasibility: clamp(52 + Math.random() * 28),
    developmentTime: clamp(34 + (hasDeepTech ? 22 : 8) + Math.random() * 24),
    maintenanceComplexity: clamp(
      30 + (hasDeepTech ? 28 : 12) + Math.random() * 24,
    ),
    viralityPotential: clamp(46 + (hasCreator ? 20 : 6) + Math.random() * 20),
    creatorEconomyAlignment: clamp(35 + (hasCreator ? 38 : 8) + Math.random() * 20),
    aiDefensibility: clamp(40 + (hasDeepTech ? 30 : 10) + Math.random() * 24),
    nicheStrength: clamp(56 + Math.random() * 26),
  };
}

export function calculateWeightedScore(scores: ScoreMap): number {
  const positiveScore =
    scores.originality * scoreWeights.originality +
    scores.profitability * scoreWeights.profitability +
    scores.feasibility * scoreWeights.feasibility +
    scores.viralityPotential * scoreWeights.viralityPotential +
    scores.creatorEconomyAlignment * scoreWeights.creatorEconomyAlignment +
    scores.aiDefensibility * scoreWeights.aiDefensibility +
    scores.nicheStrength * scoreWeights.nicheStrength;

  const invertedTime = 100 - scores.developmentTime;
  const invertedMaintenance = 100 - scores.maintenanceComplexity;

  const adjusted =
    positiveScore +
    invertedTime * scoreWeights.developmentTime +
    invertedMaintenance * scoreWeights.maintenanceComplexity;

  return clamp(adjusted);
}

function technicalDifficultyLabel(scores: ScoreMap): string {
  if (scores.feasibility >= 72 && scores.developmentTime <= 40) return "Low";
  if (scores.feasibility >= 55 && scores.developmentTime <= 65) return "Medium";
  return "High";
}

function maintenanceLabel(scores: ScoreMap): string {
  if (scores.maintenanceComplexity < 40) return "Low ongoing ops burden";
  if (scores.maintenanceComplexity < 70) return "Moderate maintenance complexity";
  return "High maintenance burden";
}

function saturationLabel(scores: ScoreMap): string {
  if (scores.originality > 75) return "Low-to-medium saturation with whitespace";
  if (scores.originality > 55) return "Medium saturation in adjacent categories";
  return "High saturation unless niche positioning is precise";
}

function buildConceptName(primary: string, secondary: string): string {
  const a = primary.slice(0, 1).toUpperCase() + primary.slice(1);
  const b = secondary.slice(0, 1).toUpperCase() + secondary.slice(1);
  return `${a} ${pick(archetypes)} for ${b}`;
}

function createConcept(
  tokens: string[],
  promptAnchor: string,
  parentId: string | null,
  version: number,
  mutationNote?: string,
): Concept {
  const primary = pick(tokens) ?? "creative";
  const secondary = pick(tokens) ?? "builders";
  const tertiary = pick(tokens) ?? "teams";
  const scores = buildScoreMap(tokens);
  const weightedScore = calculateWeightedScore(scores);
  const oneLinePitch = `An adaptive idea refinery that turns ${primary} + ${secondary} inputs into execution-ready software concepts.`;
  const problemSolved = `Founders with fragmented ${primary} and ${tertiary} insights struggle to evaluate if an idea is strategically viable before building.`;
  const targetAudience = `Indie founders, creator-operators, and small product teams exploring ${secondary} opportunities.`;
  const uniqueAngle = `Uses mutation-first concept evolution and weighted viability scoring instead of one-shot brainstorming output.`;

  return {
    id: crypto.randomUUID(),
    version,
    parentId,
    name: buildConceptName(primary, secondary),
    oneLinePitch,
    problemSolved,
    targetAudience,
    uniqueAngle,
    monetizationStrategy: pick(monetizationModes),
    technicalDifficulty: technicalDifficultyLabel(scores),
    maintenanceBurden: maintenanceLabel(scores),
    marketSaturationEstimate: saturationLabel(scores),
    noveltyScore: scores.originality,
    founderFitScore: clamp((scores.nicheStrength + scores.feasibility) / 2),
    mvpScope: mvpSlices.slice(0, 3 + Math.floor(Math.random() * 2)),
    whyThisCouldFail: pick(failurePatterns),
    hiddenOpportunity: pick(hiddenOpportunityPatterns),
    mutationIdeas: [
      `Reposition toward ${secondary} compliance workflows.`,
      `Bundle a lightweight ${tertiary} collaboration mode.`,
      `Offer an AI-assisted onboarding sprint around ${promptAnchor}.`,
    ],
    suggestedUiAesthetic: pick(aesthetics),
    scores,
    weightedScore,
    tags: [primary, secondary, "concept-forge"],
    favorite: false,
    mutationHistory: mutationNote ? [mutationNote] : [],
    createdAt: new Date().toISOString(),
  };
}

export function generateConceptsFromInput(input: IdeaInput, count = 3): Concept[] {
  const tokens = [
    ...parseField(input.interests),
    ...parseField(input.industries),
    ...parseField(input.frustrations),
    ...parseField(input.hobbies),
    ...parseField(input.technologies),
    ...parseField(input.skills),
    ...parseField(input.randomConcepts),
  ];
  const safeTokens = tokens.length ? tokens : ["automation", "creator", "systems"];
  const anchor = safeTokens.slice(0, 3).join(", ");
  return Array.from({ length: count }).map(() =>
    createConcept(safeTokens, anchor, null, 1),
  );
}

function mutateScores(scores: ScoreMap, mode: MutationMode): ScoreMap {
  const next = { ...scores };
  const set = (dimension: ScoreDimension, delta: number) => {
    next[dimension] = clamp(next[dimension] + delta);
  };

  switch (mode) {
    case "cursed":
      set("originality", 12);
      set("viralityPotential", 10);
      set("feasibility", -8);
      set("maintenanceComplexity", 8);
      break;
    case "profitable":
      set("profitability", 12);
      set("nicheStrength", 6);
      set("originality", -2);
      break;
    case "simpler":
      set("developmentTime", -18);
      set("maintenanceComplexity", -15);
      set("feasibility", 10);
      set("originality", -4);
      break;
    case "scalable":
      set("profitability", 8);
      set("maintenanceComplexity", -8);
      set("feasibility", 6);
      break;
    case "pivotB2B":
      set("profitability", 10);
      set("viralityPotential", -8);
      set("aiDefensibility", 8);
      break;
    case "pivotCreators":
      set("creatorEconomyAlignment", 18);
      set("viralityPotential", 8);
      set("nicheStrength", 6);
      break;
    case "reduceMaintenance":
      set("maintenanceComplexity", -20);
      set("developmentTime", -10);
      set("feasibility", 8);
      break;
    case "adjacent":
      set("originality", 8);
      set("nicheStrength", 4);
      set("feasibility", -4);
      break;
    case "combine":
      set("originality", 10);
      set("profitability", 8);
      set("developmentTime", 8);
      break;
    case "remix":
    default:
      set("originality", 6);
      set("aiDefensibility", 5);
      break;
  }

  return next;
}

export function mutateConcept(
  concept: Concept,
  mode: MutationMode,
  secondaryConcept?: Concept | null,
): Concept {
  const scoreProfile = mutateScores(concept.scores, mode);
  const mutationContext = mutationRecipes[mode];
  const mergedName =
    mode === "combine" && secondaryConcept
      ? `${concept.name.split(" for ")[0]} x ${secondaryConcept.name.split(" for ")[0]}`
      : concept.name;

  const mutationIdeas = secondaryConcept
    ? [
        ...concept.mutationIdeas,
        ...secondaryConcept.mutationIdeas.slice(0, 1),
        `Blend ${secondaryConcept.name} onboarding flows into this variant.`,
      ]
    : [...concept.mutationIdeas, `Stress-test this concept with mode: ${mode}.`];

  const targetAudience =
    mode === "pivotB2B"
      ? "Operations leaders, innovation teams, and product managers in SMB/mid-market companies."
      : mode === "pivotCreators"
        ? "Creator operators, solo builders, and audience-first digital product teams."
        : concept.targetAudience;

  return {
    ...concept,
    id: crypto.randomUUID(),
    parentId: concept.id,
    version: concept.version + 1,
    name: mergedName,
    uniqueAngle: `${concept.uniqueAngle} ${mutationContext}`,
    targetAudience,
    technicalDifficulty: technicalDifficultyLabel(scoreProfile),
    maintenanceBurden: maintenanceLabel(scoreProfile),
    marketSaturationEstimate: saturationLabel(scoreProfile),
    noveltyScore: scoreProfile.originality,
    founderFitScore: clamp((scoreProfile.nicheStrength + scoreProfile.feasibility) / 2),
    mutationIdeas: mutationIdeas.slice(0, 5),
    scores: scoreProfile,
    weightedScore: calculateWeightedScore(scoreProfile),
    mutationHistory: [...concept.mutationHistory, mutationContext],
    createdAt: new Date().toISOString(),
  };
}
