/**
 * QA harness for Facebook Marketplace capture v0.1.
 * Runs capture logic against realistic DOM fixtures when live FB pages are login-gated.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseHTML } from "linkedom";
import {
  marketplaceListingBatchToDealPartial,
  normalizeMarketplaceListingCapture,
} from "../../src/lib/intake/marketplace-listing-capture-import.ts";
import { validateExtensionListingImportMessage } from "../../src/lib/extension/listing-import-bridge.ts";
import { analyzeDeal } from "../../src/lib/analysis/engine.ts";
import { getGoblinVerdict } from "../../src/lib/analysis/verdict.ts";
import { EMPTY_DEAL_INPUT } from "../../src/lib/types/deal.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(__dirname, "facebook-listings");

function loadParser() {
  const code = readFileSync(
    join(__dirname, "../../extension/lib/facebook-parser-global.js"),
    "utf8"
  );
  const captureCode = readFileSync(
    join(__dirname, "../../extension/content/facebook-capture.js"),
    "utf8"
  );
  return { code, captureCode };
}

function runCaptureOnHtml(html, pageUrl) {
  const { document, window } = parseHTML(html);
  const { code, captureCode } = loadParser();
  globalThis.document = document;
  globalThis.window = window;
  globalThis.location = { href: pageUrl };
  delete globalThis.__marketplaceGoblinFacebookParser;
  delete globalThis.__marketplaceGoblinCaptureFacebook;
  // eslint-disable-next-line no-eval
  eval(code);
  // eslint-disable-next-line no-eval
  eval(captureCode);
  return globalThis.__marketplaceGoblinCaptureFacebook();
}

function gradeField(captured, expected, kind = "string") {
  if (expected == null || expected === "") return captured ? "partial" : "N";
  if (kind === "price") {
    const c = captured == null ? null : Number(captured);
    const e = Number(expected);
    if (c === e) return "Y";
    if (c != null && e != null && Math.abs(c - e) < 0.01) return "Y";
    return captured != null ? "partial" : "N";
  }
  if (kind === "url") {
    return String(captured || "").includes(String(expected).split("/").pop())
      ? "Y"
      : captured
        ? "partial"
        : "N";
  }
  const c = String(captured || "").toLowerCase();
  const e = String(expected).toLowerCase();
  if (c.includes(e) || e.includes(c)) return "Y";
  return captured ? "partial" : "N";
}

const fixtures = JSON.parse(
  readFileSync(join(fixtureDir, "manifest.json"), "utf8")
);

const rows = [];

for (const fixture of fixtures) {
  const html = readFileSync(join(fixtureDir, fixture.file), "utf8");
  const pageUrl = `https://www.facebook.com/marketplace/item/${fixture.id}/`;
  const result = runCaptureOnHtml(html, pageUrl);
  const batch = result.batch;
  const listing = batch.listing;

  const validated = validateExtensionListingImportMessage({
    type: "MARKETPLACE_GOBLIN_LISTING_IMPORT",
    payload: batch,
  });
  const importOk = validated.error == null && validated.batch != null;

  let fieldsApplied = false;
  let verdictGenerated = false;
  if (importOk) {
    const { proposed } = marketplaceListingBatchToDealPartial(validated.batch);
    const merged = { ...EMPTY_DEAL_INPUT, ...proposed };
    fieldsApplied =
      Boolean(merged.itemName || merged.askingPrice || merged.listingUrl) &&
      Boolean(merged.listingUrl);
    try {
      const analysis = analyzeDeal(merged);
      const verdict = getGoblinVerdict(merged, analysis);
      verdictGenerated = Boolean(verdict?.label);
    } catch {
      verdictGenerated = false;
    }
  }

  rows.push({
    id: fixture.id,
    category: fixture.category,
    groundTitle: fixture.expected.title,
    groundPrice: fixture.expected.price,
    title: gradeField(listing.title, fixture.expected.title),
    price: gradeField(listing.askingPrice, fixture.expected.price, "price"),
    description: gradeField(
      listing.description,
      fixture.expected.description,
      "string"
    ),
    image: listing.imageUrl ? "Y" : "N",
    url: gradeField(listing.listingUrl, fixture.id, "url"),
    confidence: `T:${listing.confidence?.title || "low"} P:${listing.confidence?.askingPrice || "low"} D:${listing.confidence?.description || "low"}`,
    fallback: batch.selectorFallback ? "Y" : "N",
    importOk: importOk ? "Y" : "N",
    fieldsApplied: fieldsApplied ? "Y" : "N",
    verdict: verdictGenerated ? "Y" : "N",
    notes: fixture.notes,
    capturedTitle: listing.title || "",
    capturedPrice: listing.askingPrice,
    fragility: fixture.fragility,
  });
}

const countY = (key) => rows.filter((r) => r[key] === "Y").length;
const total = rows.length;

console.log(JSON.stringify({ rows, summary: {
  total,
  titleSuccess: countY("title"),
  priceSuccess: countY("price"),
  descriptionSuccess: countY("description"),
  imageSuccess: countY("image"),
  urlSuccess: countY("url"),
  fallbackUsed: countY("fallback"),
  importSuccess: countY("importOk"),
  fieldsAppliedSuccess: countY("fieldsApplied"),
  verdictSuccess: countY("verdict"),
}}, null, 2));
