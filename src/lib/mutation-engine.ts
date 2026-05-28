import type { Concept, MutationType } from "@/types/concept";
import { clamp } from "@/lib/concept-generator";

const MUTATION_SUFFIXES: Record<MutationType, string> = {
  remix: "Remix",
  combine: "Fusion",
  evolve: "Evolved",
  cursed: "Cursed Edition",
  profitable: "Revenue Core",
  simpler: "Lite",
  scalable: "Scale",
  b2b: "Enterprise",
  creators: "Creator Suite",
  "low-maintenance": "Zero-Ops",
};

const MUTATION_MODIFIERS: Record<
  MutationType,
  (c: Concept) => Partial<Concept>
> = {
  remix: (c) => ({
    pitch: `Remixed: ${c.pitch} — now optimized for unexpected cross-pollination.`,
    uniqueAngle: `${c.uniqueAngle} Recombined with adjacent domain patterns for stranger, stickier positioning.`,
    tags: [...c.tags, "remix"],
    scores: {
      ...c.scores,
      originality: clamp(c.scores.originality + 12),
      feasibility: clamp(c.scores.feasibility - 5),
    },
  }),
  combine: (c) => ({
    name: `${c.name} × Fusion`,
    pitch: `Hybrid concept merging two DNA strands: ${c.pitch}`,
    problemSolved: `${c.problemSolved} — amplified by combinatorial market positioning.`,
    tags: [...c.tags, "fusion"],
    scores: {
      ...c.scores,
      originality: clamp(c.scores.originality + 18),
      nicheStrength: clamp(c.scores.nicheStrength + 8),
    },
  }),
  evolve: (c) => ({
    pitch: `Evolved market play: ${c.pitch}`,
    targetAudience: `${c.targetAudience} — expanded to adjacent buyer personas one hop away.`,
    marketSaturation: "Emerging" as const,
    mutationIdeas: [
      ...c.mutationIdeas,
      "Expand to adjacent vertical",
      "Add platform API layer",
    ],
    scores: {
      ...c.scores,
      profitability: clamp(c.scores.profitability + 10),
      viralityPotential: clamp(c.scores.viralityPotential + 6),
    },
  }),
  cursed: (c) => ({
    name: `${c.name}: Cursed Edition`,
    pitch: `Unhinged but plausible: ${c.pitch} — dialed to 11.`,
    uniqueAngle: `Lean into the weird: ${c.uniqueAngle} — now with intentional chaos energy.`,
    whyItCouldFail:
      "Too cursed for normies. Might go viral for the wrong reasons. Could attract moderation headaches.",
    hiddenOpportunity:
      "Meme-native launch on TikTok/Reddit could bootstrap awareness before polishing.",
    uiAesthetic: "Geocities meets vaporwave — intentionally offensive good taste",
    tags: [...c.tags, "cursed", "viral-bait"],
    scores: {
      ...c.scores,
      originality: clamp(c.scores.originality + 22),
      feasibility: clamp(c.scores.feasibility - 15),
      viralityPotential: clamp(c.scores.viralityPotential + 25),
      profitability: clamp(c.scores.profitability - 10),
    },
  }),
  profitable: (c) => ({
    monetization: `Revenue-first pivot: ${c.monetization} — add annual plans, usage-based tier, and services upsell.`,
    mvpScope: [
      "Payment integration on day one",
      "Single killer paid feature",
      ...c.mvpScope.slice(0, 2),
    ],
    scores: {
      ...c.scores,
      profitability: clamp(c.scores.profitability + 20),
      originality: clamp(c.scores.originality - 8),
    },
  }),
  simpler: (c) => ({
    name: `${c.name} Lite`,
    pitch: `Radically simplified: ${c.pitch.split("—")[0].trim()}.`,
    mvpScope: c.mvpScope.slice(0, 2),
    technicalDifficulty: "Low" as const,
    maintenanceBurden: "Light" as const,
    scores: {
      ...c.scores,
      feasibility: clamp(c.scores.feasibility + 18),
      developmentTime: clamp(c.scores.developmentTime + 20),
      maintenanceComplexity: clamp(c.scores.maintenanceComplexity + 15),
      originality: clamp(c.scores.originality - 5),
    },
  }),
  scalable: (c) => ({
    uniqueAngle: `${c.uniqueAngle} — architected for multi-tenant scale from day one.`,
    monetization: `${c.monetization} — emphasize usage-based pricing and API access.`,
    scores: {
      ...c.scores,
      profitability: clamp(c.scores.profitability + 12),
      maintenanceComplexity: clamp(c.scores.maintenanceComplexity - 12),
      aiDefensibility: clamp(c.scores.aiDefensibility + 10),
    },
  }),
  b2b: (c) => ({
    name: `${c.name} for Teams`,
    targetAudience: `B2B buyers: ops leads and team managers in ${c.targetAudience.split(" ")[0] || "target"} orgs.`,
    monetization: "Per-seat SaaS ($29–$79/user/mo) + annual contracts with onboarding package.",
    tags: [...c.tags, "b2b"],
    scores: {
      ...c.scores,
      profitability: clamp(c.scores.profitability + 15),
      viralityPotential: clamp(c.scores.viralityPotential - 12),
      creatorEconomyAlignment: clamp(c.scores.creatorEconomyAlignment - 20),
    },
  }),
  creators: (c) => ({
    targetAudience: `Creator-first: solo artists, streamers, and indie makers in ${c.targetAudience}.`,
    monetization: "Creator-friendly: 90/10 split marketplace, tips, and $9/mo pro creator tools.",
    tags: [...c.tags, "creators"],
    scores: {
      ...c.scores,
      creatorEconomyAlignment: clamp(c.scores.creatorEconomyAlignment + 22),
      viralityPotential: clamp(c.scores.viralityPotential + 12),
    },
  }),
  "low-maintenance": (c) => ({
    maintenanceBurden: "Light" as const,
    mvpScope: [
      "Static-first architecture",
      "Managed services only — no custom infra",
      ...c.mvpScope.slice(0, 1),
    ],
    whyItCouldFail: c.whyItCouldFail,
    hiddenOpportunity: `${c.hiddenOpportunity} — position as "set and forget" income asset.`,
    scores: {
      ...c.scores,
      maintenanceComplexity: clamp(c.scores.maintenanceComplexity + 25),
      developmentTime: clamp(c.scores.developmentTime + 10),
      feasibility: clamp(c.scores.feasibility + 8),
    },
  }),
};

export function mutateConcept(
  concept: Concept,
  type: MutationType
): Concept {
  const modifier = MUTATION_MODIFIERS[type];
  const changes = modifier(concept);
  const suffix = MUTATION_SUFFIXES[type];
  const now = new Date().toISOString();

  const mutated: Concept = {
    ...concept,
    ...changes,
    id: `${concept.id}-${type}-${Date.now()}`,
    parentId: concept.id,
    mutationType: type,
    name: changes.name ?? `${concept.name} [${suffix}]`,
    noveltyScore: changes.scores?.originality ?? concept.noveltyScore,
    founderFitScore: concept.founderFitScore,
    updatedAt: now,
    createdAt: now,
    isFavorite: false,
  };

  if (changes.scores) {
    mutated.noveltyScore = changes.scores.originality ?? mutated.noveltyScore;
    mutated.founderFitScore = clamp(
      (mutated.scores.feasibility +
        mutated.scores.nicheStrength +
        mutated.scores.developmentTime) /
        3
    );
  }

  return mutated;
}

export function combineConcepts(a: Concept, b: Concept): Concept {
  const now = new Date().toISOString();
  return {
    ...a,
    id: `fusion-${a.id}-${b.id}-${Date.now()}`,
    parentId: a.id,
    mutationType: "combine",
    name: `${a.name.split(" ")[0]} × ${b.name.split(" ")[0]}`,
    pitch: `Fusion reactor: ${a.pitch} + ${b.pitch}`,
    problemSolved: `${a.problemSolved} Cross-pollinated with: ${b.problemSolved}`,
    uniqueAngle: `${a.uniqueAngle} ⊗ ${b.uniqueAngle}`,
    monetization: `${a.monetization} Hybridized with: ${b.monetization}`,
    mvpScope: [...new Set([...a.mvpScope.slice(0, 2), ...b.mvpScope.slice(0, 2)])],
    mutationIdeas: [
      ...new Set([...a.mutationIdeas, ...b.mutationIdeas]),
    ].slice(0, 5),
    tags: [...new Set([...a.tags, ...b.tags, "fusion"])],
    scores: {
      originality: clamp((a.scores.originality + b.scores.originality) / 2 + 15),
      profitability: clamp((a.scores.profitability + b.scores.profitability) / 2 + 5),
      feasibility: clamp((a.scores.feasibility + b.scores.feasibility) / 2 - 5),
      developmentTime: clamp((a.scores.developmentTime + b.scores.developmentTime) / 2),
      maintenanceComplexity: clamp(
        (a.scores.maintenanceComplexity + b.scores.maintenanceComplexity) / 2
      ),
      viralityPotential: clamp(
        (a.scores.viralityPotential + b.scores.viralityPotential) / 2 + 10
      ),
      creatorEconomyAlignment: clamp(
        (a.scores.creatorEconomyAlignment + b.scores.creatorEconomyAlignment) / 2 + 8
      ),
      aiDefensibility: clamp((a.scores.aiDefensibility + b.scores.aiDefensibility) / 2),
      nicheStrength: clamp((a.scores.nicheStrength + b.scores.nicheStrength) / 2 + 12),
    },
    noveltyScore: 0,
    founderFitScore: 0,
    createdAt: now,
    updatedAt: now,
    isFavorite: false,
  };
}

// Fix novelty/founder fit after combine
export function finalizeConcept(c: Concept): Concept {
  return {
    ...c,
    noveltyScore: c.scores.originality,
    founderFitScore: clamp(
      (c.scores.feasibility + c.scores.nicheStrength + c.scores.developmentTime) / 3
    ),
  };
}
