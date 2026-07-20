import type { ComparableSale } from "@/lib/types/comps";
import type { DealCategory, DealInput } from "@/lib/types/deal";
import {
  buildIdentityCategoryBoosters,
  buildIdentityHaggleNotes,
} from "@/lib/analysis/item-identity";
import type {
  CategoryIntelligence,
  CategorySignal,
  CategorySignalType,
  ConfidenceAdjustment,
  IntelligenceCategory,
} from "@/lib/types/category-intelligence";
import type { ItemIdentity } from "@/lib/types/item-identity";

interface SignalDefinition {
  id: string;
  label: string;
  type: CategorySignalType;
  patterns: RegExp[];
  message: string;
  riskWeight?: number;
  severe?: boolean;
  checklistHint?: string;
  resaleNote?: string;
  negotiationNote?: string;
}

interface CategoryProfile {
  intelligenceCategory: IntelligenceCategory;
  defaultChecklist: string[];
  defaultResaleSpeed: string;
  defaultNegotiationTips: string[];
  signals: SignalDefinition[];
}

export const DEAL_TO_INTELLIGENCE_CATEGORY: Record<
  DealCategory,
  IntelligenceCategory
> = {
  Electronics: "Electronics",
  "Tools & Hardware": "Tools & Hardware",
  "Vehicles & Parts": "Vehicles",
  Furniture: "Furniture",
  Appliances: "Appliances",
  "Collectibles & Antiques": "Collectibles",
  "Clothing & Accessories": "Clothing",
  "Home & Garden": "Other",
  "Sports & Outdoors": "Other",
  "Toys & Games": "Other",
  "Books & Media": "Other",
  Other: "Other",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function buildIntelligenceHaystack(
  input: DealInput,
  comps?: ComparableSale[]
): string {
  const parts = [input.itemName, input.notes];

  for (const comp of comps ?? []) {
    parts.push(comp.title, comp.notes);
  }

  return parts.join(" ").toLowerCase();
}

function matchesSignal(haystack: string, signal: SignalDefinition): boolean {
  return signal.patterns.some((pattern) => pattern.test(haystack));
}

function toCategorySignal(signal: SignalDefinition): CategorySignal {
  return {
    id: signal.id,
    label: signal.label,
    type: signal.type,
    message: signal.message,
  };
}

const ELECTRONICS_PROFILE: CategoryProfile = {
  intelligenceCategory: "Electronics",
  defaultChecklist: [
    "Power on and test core functions",
    "Check screen, ports, and buttons",
    "Verify activation lock / account status",
    "Confirm charger and accessories included",
    "Check battery health or cycle count if applicable",
  ],
  defaultResaleSpeed:
    "Unlocked, complete electronics in popular categories often sell in 1–3 weeks.",
  defaultNegotiationTips: [
    "Missing charger or worn battery is easy leverage.",
    "Locked or untested units should be priced like parts.",
  ],
  signals: [
    {
      id: "activation-lock",
      label: "Activation lock",
      type: "risk",
      patterns: [
        /\b(activation|icloud|find my|locked|mdm|enterprise)\b/i,
      ],
      message: "Activation or account lock can block resale — verify unlock status.",
      riskWeight: 1.5,
      severe: true,
      checklistHint: "Confirm device is signed out and activation lock is off",
      resaleNote: "Locked devices move slowly or only as parts.",
      negotiationNote: "Use lock risk to push price toward parts value.",
    },
    {
      id: "battery-health",
      label: "Battery health",
      type: "risk",
      patterns: [/\b(battery|cycles?|health|degraded|swollen)\b/i],
      message: "Battery condition strongly affects resale — ask for health % or runtime.",
      riskWeight: 0.75,
      checklistHint: "Check battery health % or charge-hold time",
      negotiationNote: "Weak battery justifies a lower offer.",
    },
    {
      id: "cracked-screen",
      label: "Cracked screen",
      type: "penalty",
      patterns: [/\b(crack|cracked|broken screen|shattered|lcd)\b/i],
      message: "Screen damage cuts resale — price as repair or parts.",
      riskWeight: 1,
      checklistHint: "Inspect display, touch response, and glass",
      negotiationNote: "Quote screen repair cost when countering.",
    },
    {
      id: "missing-charger",
      label: "Missing charger",
      type: "penalty",
      patterns: [
        /\b(no charger|missing charger|without charger|charger not included)\b/i,
      ],
      message: "Missing charger/accessories reduce buyer appeal and margin.",
      riskWeight: 0.5,
      negotiationNote: "Factor $15–$40 for OEM charger/cable.",
    },
    {
      id: "includes-charger",
      label: "Includes charger",
      type: "booster",
      patterns: [
        /\b(includes? charger|with charger|oem charger|original box)\b/i,
      ],
      message: "Complete accessory set helps price and sell-through.",
    },
    {
      id: "untested",
      label: "Untested / as-is",
      type: "risk",
      patterns: [/\b(untested|as[- ]is|not tested|powers? off|won'?t turn on)\b/i],
      message: "Untested electronics are high variance — assume repair risk.",
      riskWeight: 1,
      checklistHint: "Test boot, Wi‑Fi, speakers, and charging before paying",
      negotiationNote: "Untested status is strong walk-away leverage.",
    },
  ],
};

const TOOLS_PROFILE: CategoryProfile = {
  intelligenceCategory: "Tools & Hardware",
  defaultChecklist: [
    "Run the motor and test the trigger",
    "Check batteries charge and hold",
    "Inspect chuck, blades, or bits for wear",
    "Look for rust, abuse, or missing guards",
    "Confirm included batteries, charger, and case",
  ],
  defaultResaleSpeed:
    "Pro-brand cordless tools with batteries often flip within 1–2 weeks locally.",
  defaultNegotiationTips: [
    "Bare tool pricing if batteries/charger missing.",
    "Rust or seized parts justify a steep discount.",
  ],
  signals: [
    {
      id: "missing-batteries",
      label: "Missing batteries",
      type: "penalty",
      patterns: [
        /\b(no battery|missing battery|batteries not included|bare tool)\b/i,
      ],
      message: "Tool without batteries is worth far less — price like bare tool.",
      riskWeight: 0.75,
      negotiationNote: "Subtract OEM battery + charger replacement cost.",
    },
    {
      id: "missing-charger",
      label: "Missing charger",
      type: "penalty",
      patterns: [/\b(no charger|missing charger|charger not included)\b/i],
      message: "Missing charger reduces kit value — confirm platform and voltage.",
      riskWeight: 0.5,
      negotiationNote: "Charger replacement is easy leverage.",
    },
    {
      id: "brushless-boost",
      label: "Brushless / pro tier",
      type: "booster",
      patterns: [/\b(brushless|xr\b|fuel\b|m18|m12|flexvolt|atomic)\b/i],
      message: "Brushless or pro-tier models command stronger resale.",
    },
    {
      id: "rust-penalty",
      label: "Rust / corrosion",
      type: "penalty",
      patterns: [/\b(rust|rusted|corrosion|corroded|seized)\b/i],
      message: "Rust or seized parts signal abuse — discount heavily.",
      riskWeight: 1,
      checklistHint: "Check arbor, chuck, and battery contacts for rust",
      negotiationNote: "Rust is a safety and resale hit — push price down.",
    },
    {
      id: "includes-battery",
      label: "Includes battery",
      type: "booster",
      patterns: [/\b(includes? (battery|batteries)|with (battery|batteries))\b/i],
      message: "Batteries included improve flip margin and buyer interest.",
    },
  ],
};

const VEHICLES_PROFILE: CategoryProfile = {
  intelligenceCategory: "Vehicles",
  defaultChecklist: [
    "Verify title status and VIN match",
    "Confirm mileage and maintenance history",
    "Inspect frame, rockers, and wheel wells for rust",
    "Test drive: transmission, brakes, leaks",
    "Check for liens or salvage branding",
  ],
  defaultResaleSpeed:
    "Running vehicles with clean titles are slow flips; parts-out can be faster for project cars.",
  defaultNegotiationTips: [
    "Title issues are the biggest price lever.",
    "Rust, high miles, or needs-work listings justify low offers.",
  ],
  signals: [
    {
      id: "title-issue",
      label: "Title status risk",
      type: "risk",
      patterns: [
        /\b(salvage|rebuilt title|no title|bill of sale only|lien|flood|lemon)\b/i,
      ],
      message: "Title or branding issues crush resale — verify before any deposit.",
      riskWeight: 2,
      severe: true,
      checklistHint: "Pull title and run VIN check before paying",
      resaleNote: "Salvage or branded titles narrow the buyer pool sharply.",
      negotiationNote: "Title problems should dominate your counteroffer.",
    },
    {
      id: "high-mileage",
      label: "High mileage",
      type: "penalty",
      patterns: [/\b(\d{3}[,.]?\d{3}\s*miles?|high miles?|200k|250k|300k)\b/i],
      message: "High mileage limits margin — confirm maintenance and compression.",
      riskWeight: 0.75,
      negotiationNote: "Mileage over market average is negotiation ammo.",
    },
    {
      id: "rust",
      label: "Rust",
      type: "penalty",
      patterns: [/\b(rust|rusted|frame rot|hole in frame)\b/i],
      message: "Rust is expensive to fix and scares buyers — price accordingly.",
      riskWeight: 1,
      checklistHint: "Inspect underbody, rockers, and pinch welds",
      negotiationNote: "Structural rust can justify walking away.",
    },
    {
      id: "parts-out",
      label: "Parts-out option",
      type: "booster",
      patterns: [/\b(parts?[- ]?out|parting out|for parts|engine good)\b/i],
      message: "Parts-out path may beat whole-vehicle flip if body/title is weak.",
      resaleNote: "Consider parting if whole-car demand is thin.",
    },
    {
      id: "clean-title",
      label: "Clean title",
      type: "booster",
      patterns: [/\b(clean title|clear title|title in hand)\b/i],
      message: "Clean title in hand reduces friction and supports faster resale.",
    },
  ],
};

const FURNITURE_PROFILE: CategoryProfile = {
  intelligenceCategory: "Furniture",
  defaultChecklist: [
    "Smell test for smoke or pets",
    "Check cushions, seams, and stains",
    "Measure doors/stairs for pickup fit",
    "Test stability and drawer slides",
    "Note brand, material, and style appeal",
  ],
  defaultResaleSpeed:
    "Desirable brands and mid-century pieces move faster; bulky items are local-only and slower.",
  defaultNegotiationTips: [
    "Pickup difficulty and truck rental are real costs.",
    "Stains, smells, or missing hardware justify big discounts.",
  ],
  signals: [
    {
      id: "pickup-difficulty",
      label: "Pickup difficulty",
      type: "risk",
      patterns: [
        /\b(pickup only|stairs|no help|heavy|bolted|won'?t fit|disassemble)\b/i,
      ],
      message: "Hard pickup adds cost and risk — factor labor and truck time.",
      riskWeight: 0.75,
      negotiationNote: "Your pickup hassle is leverage for a lower price.",
    },
    {
      id: "stains",
      label: "Stains / damage",
      type: "penalty",
      patterns: [/\b(stain|stained|tear|ripped|scratch|damage|broken leg)\b/i],
      message: "Visible damage limits buyer pool — inspect in person.",
      riskWeight: 0.75,
      checklistHint: "Check all sides and cushions under bright light",
      negotiationNote: "Document flaws and use them in your counter.",
    },
    {
      id: "smoke-smell",
      label: "Smoke smell",
      type: "penalty",
      patterns: [/\b(smoke|smoker|cigarette|odor|odour|musty)\b/i],
      message: "Smoke or strong odor is hard to fix — discount heavily.",
      riskWeight: 1,
      checklistHint: "Smell cushions and fabric up close",
      negotiationNote: "Odor issues scare resellers — push price down.",
    },
    {
      id: "brand-boost",
      label: "Brand / material boost",
      type: "booster",
      patterns: [
        /\b(west elm|restoration hardware|herman miller|eames|solid wood|leather|mid[- ]century)\b/i,
      ],
      message: "Recognized brand or material can speed resale and support pricing.",
      resaleNote: "Strong brand names attract more local buyers.",
    },
  ],
};

const APPLIANCES_PROFILE: CategoryProfile = {
  intelligenceCategory: "Appliances",
  defaultChecklist: [
    "Plug in and confirm it powers on",
    "Run a short cycle (wash, cool, or heat)",
    "Check hoses, seals, and doors",
    "Measure width/height for buyer fit",
    "Confirm all racks, bins, and attachments",
  ],
  defaultResaleSpeed:
    "Working appliances sell locally in 2–6 weeks; untested units drag.",
  defaultNegotiationTips: [
    "Untested = price as if it might not work.",
    "Missing parts and pickup difficulty are negotiable.",
  ],
  signals: [
    {
      id: "untested",
      label: "Not tested",
      type: "risk",
      patterns: [/\b(untested|not tested|as[- ]is|unknown if works)\b/i],
      message: "Untested appliances are risky — test before paying or discount hard.",
      riskWeight: 1,
      checklistHint: "Run a full cycle before loading into truck",
      negotiationNote: "Offer only if price assumes repair risk.",
    },
    {
      id: "powers-on",
      label: "Powers on / tested",
      type: "booster",
      patterns: [/\b(powers? on|tested|works|working|running)\b/i],
      message: "Confirmed working condition improves buyer confidence.",
    },
    {
      id: "missing-parts",
      label: "Missing parts",
      type: "penalty",
      patterns: [
        /\b(missing (rack|shelf|part|piece|bin|hose|knob)|no (rack|shelf|hose))\b/i,
      ],
      message: "Missing parts reduce value — confirm replacements are cheap.",
      riskWeight: 0.75,
      negotiationNote: "Replacement parts cost is easy counter leverage.",
    },
    {
      id: "pickup-difficulty",
      label: "Pickup difficulty",
      type: "risk",
      patterns: [/\b(pickup only|stairs|heavy|no help|basement)\b/i],
      message: "Large appliances need truck, dolly, and help — factor that in.",
      riskWeight: 0.5,
      negotiationNote: "Haul-away labor justifies a lower offer.",
    },
  ],
};

const COLLECTIBLES_PROFILE: CategoryProfile = {
  intelligenceCategory: "Collectibles",
  defaultChecklist: [
    "Verify authenticity markers vs known fakes",
    "Grade condition against sold comps",
    "Check box, manuals, and certificates",
    "Inspect for repaint, restoration, or repro",
    "Compare to recent sold listings in same grade",
  ],
  defaultResaleSpeed:
    "Authenticated, graded items with box/COA move faster; raw unknowns are niche and slow.",
  defaultNegotiationTips: [
    "Missing box/COA is major leverage on price.",
    "Condition downgrades should map to comp tiers.",
  ],
  signals: [
    {
      id: "authenticity-risk",
      label: "Authenticity risk",
      type: "risk",
      patterns: [
        /\b(replica|repro|fake|counterfeit|bootleg|repaint|restored)\b/i,
      ],
      message: "Authenticity questions kill margin — verify before buying.",
      riskWeight: 1.5,
      severe: true,
      checklistHint: "Compare serials, stamps, and known auth markers",
      negotiationNote: "Unproven authenticity should cap your offer.",
    },
    {
      id: "box-manuals",
      label: "Box / manuals / COA",
      type: "booster",
      patterns: [
        /\b(coa|certificate|graded|psa|bgs|cgc|sealed|original box|complete in box)\b/i,
      ],
      message: "Box, papers, or grading add liquidity and price support.",
      resaleNote: "Complete sets attract serious collectors faster.",
    },
    {
      id: "condition-issue",
      label: "Condition penalty",
      type: "penalty",
      patterns: [
        /\b(worn|yellowed|faded|crease|bent|scratch|damaged box|writing)\b/i,
      ],
      message: "Condition flaws move comps down a tier — price conservatively.",
      riskWeight: 0.75,
      negotiationNote: "Use comp photos at lower grades in your counter.",
    },
  ],
};

const CLOTHING_PROFILE: CategoryProfile = {
  intelligenceCategory: "Clothing",
  defaultChecklist: [
    "Check tags, size, and material",
    "Inspect seams, pits, and hems",
    "Smell test for smoke or storage odor",
    "Measure pit-to-pit and length",
    "Verify brand/style against sold comps",
  ],
  defaultResaleSpeed:
    "Hype and designer pieces move in days; basics can sit for weeks.",
  defaultNegotiationTips: [
    "Flaws and missing tags justify steep discounts.",
    "Counterfeit risk on luxury brands — verify labels.",
  ],
  signals: [
    {
      id: "nwt-boost",
      label: "New with tags",
      type: "booster",
      patterns: [/\b(nwt|nwot|new with tags|deadstock|never worn)\b/i],
      message: "NWT/NWOT status supports faster resale and stronger pricing.",
      resaleNote: "Tagged items often sell within 1–2 weeks on marketplaces.",
    },
    {
      id: "stains-holes",
      label: "Stains or damage",
      type: "penalty",
      patterns: [/\b(stain|hole|rip|tear|pilling|snag|fade)\b/i],
      message: "Visible wear limits buyer pool — disclose and discount.",
      riskWeight: 0.75,
      negotiationNote: "Document flaws for your counteroffer.",
    },
    {
      id: "counterfeit-risk",
      label: "Counterfeit risk",
      type: "risk",
      patterns: [/\b(replica|fake|inspired|dupe|counterfeit)\b/i],
      message: "Luxury without proof of authenticity is high risk.",
      riskWeight: 1.5,
      severe: true,
      checklistHint: "Verify tags, stitching, and serial/date codes",
      negotiationNote: "Auth uncertainty should cap offer well below retail.",
    },
    {
      id: "designer-boost",
      label: "Designer / premium brand",
      type: "booster",
      patterns: [
        /\b(patagonia|north face|arc'?teryx|supreme|nike|jordan|yeezy|gucci|prada)\b/i,
      ],
      message: "Recognized brands improve demand and resale speed.",
    },
  ],
};

const OTHER_PROFILE: CategoryProfile = {
  intelligenceCategory: "Other",
  defaultChecklist: [
    "Confirm item works as described",
    "Compare to 3+ sold comps",
    "Inspect for hidden damage or missing parts",
    "Factor pickup/shipping cost into margin",
    "Verify demand before committing capital",
  ],
  defaultResaleSpeed:
    "Generic items depend on demand — expect 2–6 weeks unless comps show fast movers.",
  defaultNegotiationTips: [
    "Use comp gaps and condition gaps in your counter.",
    "Untested or incomplete listings deserve lower offers.",
  ],
  signals: [
    {
      id: "untested",
      label: "Untested / as-is",
      type: "risk",
      patterns: [/\b(untested|as[- ]is|not tested|unknown condition)\b/i],
      message: "Untested items carry extra risk — verify or discount.",
      riskWeight: 0.75,
      negotiationNote: "Price as if repair might be needed.",
    },
    {
      id: "missing-parts",
      label: "Missing parts",
      type: "penalty",
      patterns: [/\b(missing|incomplete|not included|without)\b/i],
      message: "Incomplete listings often need a lower buy price.",
      riskWeight: 0.5,
    },
    {
      id: "pickup-only",
      label: "Pickup only",
      type: "risk",
      patterns: [/\b(pickup only|local only|no shipping)\b/i],
      message: "Local pickup limits buyer pool — factor your time and fuel.",
      riskWeight: 0.5,
      negotiationNote: "Pickup hassle is reasonable leverage.",
    },
  ],
};

const PROFILES: Record<IntelligenceCategory, CategoryProfile> = {
  Electronics: ELECTRONICS_PROFILE,
  "Tools & Hardware": TOOLS_PROFILE,
  Vehicles: VEHICLES_PROFILE,
  Furniture: FURNITURE_PROFILE,
  Appliances: APPLIANCES_PROFILE,
  Collectibles: COLLECTIBLES_PROFILE,
  Clothing: CLOTHING_PROFILE,
  Other: OTHER_PROFILE,
};

function buildChecklist(
  profile: CategoryProfile,
  matchedSignals: SignalDefinition[]
): string[] {
  const prioritized = matchedSignals
    .map((signal) => signal.checklistHint)
    .filter((hint): hint is string => Boolean(hint));

  const merged = [...prioritized, ...profile.defaultChecklist];
  return [...new Set(merged)].slice(0, 7);
}

function buildResaleSpeedNotes(
  profile: CategoryProfile,
  matchedSignals: SignalDefinition[]
): string[] {
  const notes = [profile.defaultResaleSpeed];

  for (const signal of matchedSignals) {
    if (signal.resaleNote) notes.push(signal.resaleNote);
  }

  return [...new Set(notes)];
}

function buildNegotiationNotes(
  profile: CategoryProfile,
  matchedSignals: SignalDefinition[]
): string[] {
  const notes = [...profile.defaultNegotiationTips];

  for (const signal of matchedSignals) {
    if (signal.negotiationNote) notes.push(signal.negotiationNote);
  }

  return [...new Set(notes)].slice(0, 6);
}

function buildAdvice(
  intelligenceCategory: IntelligenceCategory,
  risks: CategorySignal[],
  boosters: CategorySignal[],
  penalties: CategorySignal[]
): string[] {
  const advice: string[] = [];

  if (risks.length > 0) {
    advice.push(
      `${intelligenceCategory}: ${risks.length} hidden risk signal${risks.length === 1 ? "" : "s"} detected — verify before buying.`
    );
  }

  for (const booster of boosters.slice(0, 2)) {
    advice.push(booster.message);
  }

  for (const penalty of penalties.slice(0, 2)) {
    advice.push(penalty.message);
  }

  if (advice.length === 0) {
    advice.push(
      `${intelligenceCategory}: No category-specific red flags in listing text — still run the checklist.`
    );
  }

  return advice;
}

function buildWarnings(risks: CategorySignal[], penalties: CategorySignal[]): string[] {
  const warnings: string[] = [];

  for (const risk of risks) {
    warnings.push(`Category risk: ${risk.message}`);
  }

  for (const penalty of penalties.slice(0, 2)) {
    warnings.push(`Value penalty: ${penalty.message}`);
  }

  return warnings;
}

function calculateRiskAdjustment(
  matched: SignalDefinition[],
  boosters: SignalDefinition[]
): number {
  let adjustment = 0;

  for (const signal of matched) {
    if (signal.type === "risk" || signal.type === "penalty") {
      adjustment += signal.riskWeight ?? 0.5;
    }
  }

  adjustment -= boosters.length * 0.25;

  return clamp(Math.round(adjustment * 2) / 2, 0, 3);
}

function calculateConfidenceAdjustment(
  matched: SignalDefinition[]
): ConfidenceAdjustment {
  const hasSevere = matched.some((signal) => signal.severe);
  const penaltyCount = matched.filter((signal) => signal.type === "penalty").length;
  const riskCount = matched.filter((signal) => signal.type === "risk").length;

  if (hasSevere) return "downgrade_to_low";
  if (penaltyCount >= 2 || riskCount >= 2) return "downgrade_one";
  if (penaltyCount >= 1 && riskCount >= 1) return "downgrade_one";

  return "none";
}

export function getCategoryProfile(
  dealCategory: DealCategory
): CategoryProfile {
  const intelligenceCategory = DEAL_TO_INTELLIGENCE_CATEGORY[dealCategory];
  return PROFILES[intelligenceCategory];
}

export function buildCategoryIntelligence(
  input: DealInput,
  comps?: ComparableSale[],
  itemIdentity?: ItemIdentity
): CategoryIntelligence {
  const intelligenceCategory = DEAL_TO_INTELLIGENCE_CATEGORY[input.category];
  const profile = PROFILES[intelligenceCategory];
  const haystack = buildIntelligenceHaystack(input, comps);

  const matchedDefinitions = profile.signals.filter((signal) =>
    matchesSignal(haystack, signal)
  );

  const matchedRisks = matchedDefinitions
    .filter((signal) => signal.type === "risk")
    .map(toCategorySignal);
  const matchedBoosters = matchedDefinitions
    .filter((signal) => signal.type === "booster")
    .map(toCategorySignal);

  if (itemIdentity) {
    for (const booster of buildIdentityCategoryBoosters(itemIdentity)) {
      matchedBoosters.push({
        id: `identity-${booster.label.toLowerCase().replace(/\s+/g, "-")}`,
        label: booster.label,
        type: "booster",
        message: booster.message,
      });
    }
  }
  const matchedPenalties = matchedDefinitions
    .filter((signal) => signal.type === "penalty")
    .map(toCategorySignal);

  const riskAdjustment = calculateRiskAdjustment(
    matchedDefinitions,
    matchedDefinitions.filter((signal) => signal.type === "booster")
  );
  const confidenceAdjustment = calculateConfidenceAdjustment(matchedDefinitions);

  return {
    intelligenceCategory,
    dealCategory: input.category,
    matchedRisks,
    matchedBoosters,
    matchedPenalties,
    inspectionChecklist: buildChecklist(profile, matchedDefinitions),
    resaleSpeedNotes: buildResaleSpeedNotes(profile, matchedDefinitions),
    negotiationLeverageNotes: [
      ...buildNegotiationNotes(profile, matchedDefinitions),
      ...(itemIdentity ? buildIdentityHaggleNotes(itemIdentity) : []),
    ],
    advice: buildAdvice(
      intelligenceCategory,
      matchedRisks,
      matchedBoosters,
      matchedPenalties
    ),
    warnings: buildWarnings(matchedRisks, matchedPenalties),
    riskAdjustment,
    confidenceAdjustment,
  };
}

export function applyConfidenceAdjustment(
  confidence: "low" | "medium" | "high",
  adjustment: ConfidenceAdjustment
): "low" | "medium" | "high" {
  if (adjustment === "none") return confidence;
  if (adjustment === "downgrade_to_low") return "low";
  if (confidence === "high") return "medium";
  if (confidence === "medium") return "low";
  return "low";
}
