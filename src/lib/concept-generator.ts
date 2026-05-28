import type {
  Concept,
  ConceptInput,
  ConceptScores,
  DifficultyLevel,
  MaintenanceBurden,
  SaturationLevel,
} from "@/types/concept";

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function flattenInputs(input: ConceptInput): string[] {
  return [
    ...input.interests,
    ...input.industries,
    ...input.frustrations,
    ...input.hobbies,
    ...input.technologies,
    ...input.skills,
    ...input.randomConcepts,
  ].filter(Boolean);
}

interface ConceptTemplate {
  namePattern: (tokens: string[]) => string;
  pitchPattern: (tokens: string[]) => string;
  problem: (tokens: string[]) => string;
  audience: (tokens: string[]) => string;
  angle: (tokens: string[]) => string;
  monetization: string;
  difficulty: DifficultyLevel;
  maintenance: MaintenanceBurden;
  saturation: SaturationLevel;
  mvp: string[];
  fail: string;
  hidden: string;
  mutations: string[];
  aesthetic: string;
  baseScores: Partial<ConceptScores>;
  tags: string[];
}

const TEMPLATES: ConceptTemplate[] = [
  {
    namePattern: (t) => `${pick(["Echo", "Pulse", "Lattice", "Drift", "Prism"], hashString(t.join("")))}${pick(t, 0) || "Forge"}`,
    pitchPattern: (t) =>
      `A ritual-aware ${t[0] || "workflow"} copilot that turns messy creative sessions into shippable artifacts.`,
    problem: (t) =>
      `Creators in ${t[0] || "niche"} spaces lose momentum because ideation, feedback, and execution live in five disconnected tools.`,
    audience: (t) =>
      `Solo builders and small teams obsessed with ${t.slice(0, 2).join(" + ") || "craft"} who hate generic productivity apps.`,
    angle: (_t) =>
      `Instead of another dashboard, it models your creative "energy curve" and only surfaces actions when you're statistically likely to act.`,
    monetization:
      "Freemium with a $19/mo Pro tier for unlimited concept branches + export packs. Team seats at $12/user for shared mutation history.",
    difficulty: "Medium",
    maintenance: "Moderate",
    saturation: "Emerging",
    mvp: [
      "Input ritual builder (3-step onboarding)",
      "Session capture + auto-tagging",
      "Mutation timeline with 5 preset evolutions",
      "Export to Notion/Obsidian markdown",
    ],
    fail: "Users treat it as a journal instead of a decision engine — engagement dies after week two.",
    hidden:
      "Partner with micro-communities (Discord, subreddits) as white-label 'idea reactors' for their members.",
    mutations: [
      "Add async critique rooms",
      "Pivot to agency client discovery",
      "Bundle with calendar blocking API",
    ],
    aesthetic: "Obsidian vault meets synthwave lab — deep charcoal, violet accents, soft particle trails",
    baseScores: {
      originality: 78,
      profitability: 62,
      feasibility: 71,
      developmentTime: 68,
      maintenanceComplexity: 55,
      viralityPotential: 74,
      creatorEconomyAlignment: 88,
      aiDefensibility: 65,
      nicheStrength: 82,
    },
    tags: ["creator-tool", "workflow", "ritual"],
  },
  {
    namePattern: (t) =>
      `${pick(["Niche", "Micro", "Signal"], hashString(t[1] || ""))}${pick(["Ops", "Stack", "Relay"], hashString(t.join("")))}`,
    pitchPattern: (t) =>
      `Vertical automation that kills the "${t[1] || "manual"}" tax for ${t[0] || "operators"} without enterprise bloat.`,
    problem: (t) =>
      `${t[1] || "Operators"} waste 6–12 hours/week on repetitive coordination that generic Zapier stacks can't model safely.`,
    audience: (t) =>
      `Bootstrapped ${t[0] || "business"} owners with 1–5 person teams who need opinionated automation, not blank canvases.`,
    angle: (_t) =>
      `Pre-built "playbooks" sourced from real operator interviews — each workflow includes failure modes and rollback recipes.`,
    monetization:
      "$49–$149/mo tiered by playbook count + usage. One-time setup fee for custom playbook authoring ($500–$2k).",
    difficulty: "High",
    maintenance: "Heavy",
    saturation: "Crowded",
    mvp: [
      "3 flagship playbooks with guided setup",
      "Webhook + email ingestion",
      "Run history with anomaly highlights",
      "Slack digest notifications",
    ],
    fail: "Sales cycle too long for solo founders; churn if first playbook doesn't save time in 7 days.",
    hidden:
      "Sell anonymized workflow telemetry as industry benchmarks — operators pay for peer comparison insights.",
    mutations: [
      "Strip to single-playbook micro-SaaS",
      "Add AI exception triage",
      "White-label for consultants",
    ],
    aesthetic: "Linear-dark with amber status LEDs and monospace telemetry readouts",
    baseScores: {
      originality: 55,
      profitability: 85,
      feasibility: 48,
      developmentTime: 42,
      maintenanceComplexity: 38,
      viralityPotential: 45,
      creatorEconomyAlignment: 35,
      aiDefensibility: 72,
      nicheStrength: 76,
    },
    tags: ["automation", "b2b", "playbook"],
  },
  {
    namePattern: (t) =>
      `${pick(["Glitch", "Odd", "Fringe"], hashString(t.join("")))} ${pick(t, 0) || "Atlas"}`,
    pitchPattern: (t) =>
      `A deliberately weird marketplace connecting ${t[0] || "niche"} obsessives with hyper-specific micro-services.`,
    problem: (_t) =>
      `Passion economies have supply and demand, but discovery is broken — buyers can't find sellers who speak their subculture fluently.`,
    audience: (t) =>
      `Hyper-niche creators and collectors in ${t.slice(0, 2).join("/") || "adjacent"} communities who distrust Fiverr energy.`,
    angle: (_t) =>
      `Reputation is built through "proof-of-obsession" artifacts (loops, configs, templates) not star ratings.`,
    monetization:
      "8% take rate + featured placement slots. Premium seller profiles at $15/mo with analytics on buyer intent signals.",
    difficulty: "Medium",
    maintenance: "Ops-Heavy",
    saturation: "Open",
    mvp: [
      "Category-specific listing templates",
      "Proof artifact upload + verification",
      "Escrow-lite payments (Stripe Connect)",
      "Community-curated discovery feeds",
    ],
    fail: "Chicken-and-egg liquidity — needs seeded supply in one vertical before expanding.",
    hidden:
      "Launch as invite-only within a single Discord server; expand only when weekly GMV hits threshold.",
    mutations: [
      "Add subscription boxes for digital goods",
      "Pivot to B2B licensing of seller tools",
      "Geo-fence to one city subculture first",
    ],
    aesthetic: "Craigslist brutalism meets neon bazaar — high contrast, chaotic but intentional",
    baseScores: {
      originality: 92,
      profitability: 58,
      feasibility: 52,
      developmentTime: 45,
      maintenanceComplexity: 30,
      viralityPotential: 81,
      creatorEconomyAlignment: 94,
      aiDefensibility: 40,
      nicheStrength: 90,
    },
    tags: ["marketplace", "niche", "community"],
  },
  {
    namePattern: (t) =>
      `${pick(["Lens", "Scope", "Cipher"], hashString(t[0] || ""))} for ${pick(t, 1) || "Builders"}`,
    pitchPattern: (t) =>
      `Decision intelligence for people navigating ${t[1] || "complex"} domains — surfaces what to build next, not more ideas.`,
    problem: (t) =>
      `Founders drown in possibilities; they need constraint engines that respect their skills in ${t[2] || "tech"} and psychology.`,
    audience: (_t) =>
      `Technical solo founders with ADHD-adjacent workflows who've abandoned 10+ side projects.`,
    angle: (_t) =>
      `Scores ideas against YOUR stated skills and energy patterns — not generic market size theater.`,
    monetization:
      "$12/mo personal tier. $39/mo with team comparison + export. Lifetime founding member at $149.",
    difficulty: "Low",
    maintenance: "Light",
    saturation: "Emerging",
    mvp: [
      "Skill-weighted scoring engine",
      'Weekly "commitment contract" ritual',
      "Idea graveyard with learnings",
      "Browser extension for capture",
    ],
    fail: "Becomes another idea hoarding tool without accountability mechanics.",
    hidden:
      'Integrate with GitHub commit patterns to auto-score "execution fit" over time.',
    mutations: [
      "Add accountability pods",
      "Sell templates to accelerators",
      "Strip to scoring API only",
    ],
    aesthetic: "Calm cyber-clinic — muted teals, glass panels, breathing animations",
    baseScores: {
      originality: 70,
      profitability: 68,
      feasibility: 88,
      developmentTime: 85,
      maintenanceComplexity: 78,
      viralityPotential: 62,
      creatorEconomyAlignment: 55,
      aiDefensibility: 58,
      nicheStrength: 73,
    },
    tags: ["founder-tool", "scoring", "focus"],
  },
  {
    namePattern: (t) =>
      `${pick(["Resonance", "Harmonic", "Phase"], hashString(t.join("")))} ${pick(t, 0) || "Kit"}`,
    pitchPattern: (t) =>
      `Hardware-optional sensory tool for ${t[0] || "performers"} — software that feels physical.`,
    problem: (t) =>
      `${t[0] || "Performers"} can't A/B creative decisions because feedback loops are too slow and too verbal.`,
    audience: (t) =>
      `Bedroom producers, live loopers, and ${t[1] || "hobby"} experimenters who think in vibes, not spreadsheets.`,
    angle: (_t) =>
      `Visualizes creative decisions as spatial "fields" you can drag, combine, and mutate — like a DAW for ideation.`,
    monetization:
      "One-time $39 license + $8/mo cloud sync. Sample pack marketplace with 20% rev share.",
    difficulty: "High",
    maintenance: "Moderate",
    saturation: "Open",
    mvp: [
      "Spatial canvas with 3 node types",
      "Audio/MIDI import for mood tagging",
      "Preset mutation sliders",
      "Offline-first desktop shell (Tauri)",
    ],
    fail: "Too abstract — users bounce without a 60-second wow moment.",
    hidden:
      "Partner with gear brands for co-branded preset packs that drive acquisition.",
    mutations: [
      "Strip to mobile companion app",
      "B2B for music schools",
      "Add collaborative jam rooms",
    ],
    aesthetic: "Teenage Engineering × Blade Runner — tactile knobs, holographic waveforms",
    baseScores: {
      originality: 86,
      profitability: 52,
      feasibility: 44,
      developmentTime: 38,
      maintenanceComplexity: 50,
      viralityPotential: 88,
      creatorEconomyAlignment: 91,
      aiDefensibility: 48,
      nicheStrength: 85,
    },
    tags: ["creative", "sensory", "music"],
  },
  {
    namePattern: (t) =>
      `${pick(["Vault", "Sentinel", "Bastion"], hashString(t[1] || ""))} ${pick(t, 0) || "Guard"}`,
    pitchPattern: (t) =>
      `Security posture coach for ${t[0] || "indie"} builders who can't afford a SOC team.`,
    problem: (_t) =>
      `Solo SaaS founders ship fast and accumulate scary attack surfaces — but security tools assume enterprise maturity.`,
    audience: (t) =>
      `Indie hackers and micro-SaaS teams in ${t[1] || "regulated-adjacent"} spaces (health, fintech-lite, education).`,
    angle: (_t) =>
      `Translates CVE noise into "founder English" prioritized by your actual stack and revenue risk.`,
    monetization:
      "$29/mo monitoring + $99 one-time audit report. Affiliate revenue from recommended tooling.",
    difficulty: "Medium",
    maintenance: "Moderate",
    saturation: "Crowded",
    mvp: [
      "Stack fingerprint questionnaire",
      'Weekly "founder risk digest"',
      "Auto-generated remediation checklist",
      "Integration with GitHub Dependabot",
    ],
    fail: "Liability anxiety — founders want insurance, not another alert firehose.",
    hidden:
      "Bundle with legal template packs for privacy policies tuned to your data flows.",
    mutations: [
      "Pivot to agency white-label",
      "Add compliance certification prep",
      "Strip to checklist-only free tool",
    ],
    aesthetic: "War room terminal — green phosphor accents on matte black, minimal chrome",
    baseScores: {
      originality: 48,
      profitability: 79,
      feasibility: 65,
      developmentTime: 60,
      maintenanceComplexity: 52,
      viralityPotential: 38,
      creatorEconomyAlignment: 28,
      aiDefensibility: 75,
      nicheStrength: 68,
    },
    tags: ["security", "saas", "compliance"],
  },
];

function generateScores(
  template: ConceptTemplate,
  seed: number,
  tokens: string[]
): ConceptScores {
  const jitter = (base: number) => clamp(base + ((seed % 17) - 8));
  const tokenBoost = tokens.length > 4 ? 5 : tokens.length > 2 ? 2 : 0;
  const base = template.baseScores;

  return {
    originality: jitter((base.originality ?? 60) + tokenBoost),
    profitability: jitter(base.profitability ?? 60),
    feasibility: jitter(base.feasibility ?? 60),
    developmentTime: jitter(base.developmentTime ?? 60),
    maintenanceComplexity: jitter(base.maintenanceComplexity ?? 60),
    viralityPotential: jitter((base.viralityPotential ?? 60) + tokenBoost / 2),
    creatorEconomyAlignment: jitter(base.creatorEconomyAlignment ?? 60),
    aiDefensibility: jitter(base.aiDefensibility ?? 60),
    nicheStrength: jitter((base.nicheStrength ?? 60) + tokenBoost),
  };
}

function createConceptFromTemplate(
  template: ConceptTemplate,
  tokens: string[],
  seed: number,
  sourceInputs: string[]
): Omit<Concept, "id" | "createdAt" | "updatedAt" | "isFavorite"> {
  const name = template.namePattern(tokens);
  const scores = generateScores(template, seed, tokens);

  return {
    name,
    pitch: template.pitchPattern(tokens),
    problemSolved: template.problem(tokens),
    targetAudience: template.audience(tokens),
    uniqueAngle: template.angle(tokens),
    monetization: template.monetization,
    technicalDifficulty: template.difficulty,
    maintenanceBurden: template.maintenance,
    marketSaturation: template.saturation,
    noveltyScore: scores.originality,
    founderFitScore: clamp(
      (scores.feasibility + scores.nicheStrength + scores.developmentTime) / 3
    ),
    mvpScope: template.mvp,
    whyItCouldFail: template.fail,
    hiddenOpportunity: template.hidden,
    mutationIdeas: template.mutations,
    uiAesthetic: template.aesthetic,
    scores,
    tags: [
      ...template.tags,
      ...tokens.slice(0, 3).map((t) => t.toLowerCase().replace(/\s+/g, "-")),
    ],
    sourceInputs,
  };
}

export function generateConcepts(
  input: ConceptInput,
  count = 3
): Concept[] {
  const tokens = flattenInputs(input);
  const seedBase =
    tokens.length > 0
      ? hashString(tokens.join("|"))
      : hashString("forge-default");

  if (tokens.length === 0) {
    tokens.push("automation", "creators", "niche software");
  }

  const now = new Date().toISOString();
  const concepts: Concept[] = [];

  for (let i = 0; i < count; i++) {
    const seed = seedBase + i * 997;
    const template = pick(TEMPLATES, seed);
    const partial = createConceptFromTemplate(template, tokens, seed, tokens);

    concepts.push({
      ...partial,
      id: `concept-${seed}-${i}`,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  return concepts;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
