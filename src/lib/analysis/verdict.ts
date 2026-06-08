import type { DealAnalysis, DealInput, GoblinVerdict } from "@/lib/types/deal";

function estimateDisclaimer(analysis: DealAnalysis): string | null {
  if (analysis.resaleEstimate.source !== "estimated") return null;
  return "Based on a fast rough estimate — verify sold comps before buying.";
}

function buildApprovedReasoning(
  input: DealInput,
  analysis: DealAnalysis
): string[] {
  const reasons: string[] = [];

  reasons.push(
    `Solid ${analysis.roiPercent.toFixed(0)}% ROI with $${analysis.potentialProfit.toFixed(0)} potential profit.`
  );

  if (analysis.flipScore >= 8) {
    reasons.push("Strong flip potential — this item should move quickly.");
  }

  if (analysis.riskScore <= 3) {
    reasons.push("Low risk profile for this category and condition.");
  }

  if (input.condition === "New" || input.condition === "Like New") {
    reasons.push(
      `${input.condition} condition gives you room to price competitively.`
    );
  }

  reasons.push(`Estimated time to sell: ${analysis.timeToSellLabel}.`);

  const disclaimer = estimateDisclaimer(analysis);
  if (disclaimer) reasons.push(disclaimer);

  return reasons;
}

function buildCautionReasoning(
  input: DealInput,
  analysis: DealAnalysis
): string[] {
  const reasons: string[] = [];

  if (analysis.potentialProfit > 0 && analysis.roiPercent < 25) {
    reasons.push(
      `Margins are thin at ${analysis.roiPercent.toFixed(0)}% ROI — one bad haggle eats your profit.`
    );
  }

  if (analysis.riskScore >= 5) {
    reasons.push(
      `Risk score of ${analysis.riskScore}/10 — verify condition and demand before committing.`
    );
  }

  if (analysis.flipScore < 7) {
    reasons.push(
      `Flip score of ${analysis.flipScore}/10 suggests this won't be an easy sell.`
    );
  }

  if (input.condition === "Fair" || input.condition === "Poor") {
    reasons.push(
      `${input.condition} condition may limit your buyer pool and resale price.`
    );
  }

  if (analysis.timeToSellDays > 45) {
    reasons.push(
      `Could sit for ${analysis.timeToSellLabel} — factor in holding costs.`
    );
  }

  if (input.askingPrice > 500) {
    reasons.push(
      "Higher ticket item — negotiate hard and confirm comps before buying."
    );
  }

  if (analysis.resaleEstimate.confidence === "low") {
    reasons.push(
      "Low estimate confidence — add brand/model details or check comps yourself."
    );
  }

  const disclaimer = estimateDisclaimer(analysis);
  if (disclaimer) reasons.push(disclaimer);

  if (reasons.length === 0) {
    reasons.push(
      "Mixed signals on this deal — worth a closer look but not a slam dunk."
    );
  }

  return reasons;
}

function buildRejectReasoning(
  input: DealInput,
  analysis: DealAnalysis
): string[] {
  const reasons: string[] = [];

  if (analysis.potentialProfit <= 0) {
    reasons.push(
      analysis.resaleEstimate.midpoint < input.askingPrice
        ? `You'd lose $${Math.abs(analysis.potentialProfit).toFixed(0)} on this flip.`
        : "No profit margin — you're paying market rate or above."
    );
  }

  if (analysis.roiPercent < 10 && analysis.potentialProfit > 0) {
    reasons.push(
      `Only ${analysis.roiPercent.toFixed(0)}% ROI — not worth the effort and risk.`
    );
  }

  if (analysis.riskScore >= 8) {
    reasons.push(
      `Risk score of ${analysis.riskScore}/10 — too many red flags for a confident flip.`
    );
  }

  if (analysis.flipScore <= 3) {
    reasons.push(
      "Low flip score — this item will be hard to move at a profit."
    );
  }

  if (input.condition === "Poor") {
    reasons.push(
      "Poor condition severely limits resale potential and buyer interest."
    );
  }

  const disclaimer = estimateDisclaimer(analysis);
  if (disclaimer) reasons.push(disclaimer);

  if (reasons.length === 0) {
    reasons.push("The numbers don't support this purchase — keep hunting.");
  }

  return reasons;
}

export function getGoblinVerdict(
  input: DealInput,
  analysis: DealAnalysis
): GoblinVerdict {
  const { potentialProfit, roiPercent, riskScore, flipScore } = analysis;

  const isReject =
    potentialProfit <= 0 ||
    riskScore >= 8 ||
    flipScore <= 3 ||
    (potentialProfit > 0 && roiPercent < 10);

  const isApproved =
    !isReject &&
    flipScore >= 7 &&
    riskScore <= 4 &&
    potentialProfit > 0 &&
    roiPercent >= 25;

  if (isApproved) {
    return {
      type: "approved",
      label: "Goblin Approved",
      emoji: "🟢",
      reasoning: buildApprovedReasoning(input, analysis),
    };
  }

  if (isReject) {
    return {
      type: "reject",
      label: "Leave It In The Cave",
      emoji: "🔴",
      reasoning: buildRejectReasoning(input, analysis),
    };
  }

  return {
    type: "caution",
    label: "Proceed With Caution",
    emoji: "🟡",
    reasoning: buildCautionReasoning(input, analysis),
  };
}
