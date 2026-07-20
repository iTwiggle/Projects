import { getFacebookPageKind } from "../lib/facebook-parser.js";
import { sendBatchToGoblin, sendListingBatchToGoblin } from "../lib/goblin-bridge.js";

/** @type {import('../lib/schema.js').CompCaptureBatch | null} */
let currentCompBatch = null;
/** @type {import('../lib/listing-schema.js').MarketplaceListingCaptureBatch | null} */
let currentListingBatch = null;
/** @type {"ebay" | "facebook" | null} */
let activePlatform = null;

const pageStatusEl = document.getElementById("page-status");
const scrollHintEl = document.getElementById("scroll-hint");
const captureBtn = document.getElementById("capture-btn");
const statsPanel = document.getElementById("stats-panel");
const statCaptured = document.getElementById("stat-captured");
const statValid = document.getElementById("stat-valid");
const statDuplicates = document.getElementById("stat-duplicates");
const statSkipped = document.getElementById("stat-skipped");
const captureMetaEl = document.getElementById("capture-meta");
const previewSection = document.getElementById("preview");
const previewList = document.getElementById("preview-list");
const exportActionsEl = document.getElementById("export-actions");
const sendBtn = document.getElementById("send-btn");
const copyBtn = document.getElementById("copy-btn");
const toastEl = document.getElementById("toast");

function getEbayPageKind(url) {
  try {
    const { pathname } = new URL(url);
    if (pathname.includes("/sch/") || pathname.includes("/b/")) return "search";
    if (pathname.includes("/itm/")) return "item";
    return null;
  } catch {
    return null;
  }
}

function detectPlatform(url) {
  if (getEbayPageKind(url)) return "ebay";
  if (getFacebookPageKind(url)) return "facebook";
  return null;
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.remove("hidden");
  window.setTimeout(() => {
    toastEl.classList.add("hidden");
  }, 3500);
}

function renderEbayStats(stats) {
  statCaptured.textContent = String(stats.capturedThisRun ?? 0);
  statValid.textContent = String(stats.validComps ?? 0);
  statDuplicates.textContent = String(stats.duplicateRows ?? 0);
  statSkipped.textContent = String(stats.skippedRows ?? 0);
  statsPanel.classList.remove("hidden");
}

function renderEbayPreview(batch) {
  previewList.innerHTML = "";

  if (batch.comps.length === 0) {
    const empty = document.createElement("li");
    empty.className = "preview-meta";
    empty.textContent = "No valid comps captured on this page.";
    previewList.appendChild(empty);
    return;
  }

  for (const comp of batch.comps) {
    const li = document.createElement("li");
    li.className = "preview-item";

    const title = document.createElement("p");
    title.className = "preview-title";
    title.textContent = comp.title;

    const meta = document.createElement("p");
    meta.className = "preview-meta";
    const typeClass =
      comp.listingType === "sold" ? "badge-sold" : "badge-listed";
    const listingConfidence = comp.confidence?.listingType;
    const lowTag =
      listingConfidence === "low"
        ? ' · <span class="badge-low-confidence">low confidence</span>'
        : "";
    meta.innerHTML = `<span class="${typeClass}">${comp.listingType}</span> · $${comp.price.toFixed(2)} · ${comp.platform}${lowTag}`;

    li.appendChild(title);
    li.appendChild(meta);
    previewList.appendChild(li);
  }
}

function renderListingPreview(batch) {
  previewList.innerHTML = "";
  const listing = batch.listing;
  const li = document.createElement("li");
  li.className = "preview-item";

  const title = document.createElement("p");
  title.className = "preview-title";
  title.textContent = listing.title || "(title not detected)";

  const meta = document.createElement("p");
  meta.className = "preview-meta";
  const price =
    listing.askingPrice != null
      ? `$${Number(listing.askingPrice).toFixed(2)}`
      : "price not detected";
  const fallbackTag = batch.selectorFallback
    ? ' · <span class="badge-low-confidence">fallback capture</span>'
    : "";
  meta.innerHTML = `${batch.platform} · ${price}${fallbackTag}`;

  if (listing.description) {
    const desc = document.createElement("p");
    desc.className = "preview-meta";
    desc.textContent = listing.description.slice(0, 160);
    li.appendChild(title);
    li.appendChild(meta);
    li.appendChild(desc);
  } else {
    li.appendChild(title);
    li.appendChild(meta);
  }

  previewList.appendChild(li);
}

function hasExportableCapture() {
  if (activePlatform === "ebay") {
    return Boolean(currentCompBatch?.comps?.length);
  }
  if (activePlatform === "facebook") {
    return Boolean(currentListingBatch?.listing?.rawText);
  }
  return false;
}

function showExportActions() {
  exportActionsEl.classList.remove("hidden");
  const enabled = hasExportableCapture();
  sendBtn.disabled = !enabled;
  copyBtn.disabled = !enabled;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function injectEbayCaptureScripts(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["lib/ebay-parser-global.js"],
  });
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content/ebay-capture.js"],
  });
}

async function injectFacebookCaptureScripts(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["lib/facebook-parser-global.js"],
  });
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content/facebook-capture.js"],
  });
}

async function runEbayCapture(tabId) {
  await injectEbayCaptureScripts(tabId);
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => globalThis.__marketplaceGoblinCaptureEbay?.(),
  });
  return result?.result ?? null;
}

async function runFacebookCapture(tabId) {
  await injectFacebookCaptureScripts(tabId);
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => globalThis.__marketplaceGoblinCaptureFacebook?.(),
  });
  return result?.result ?? null;
}

async function init() {
  const tab = await getActiveTab();
  if (!tab?.id || !tab.url) {
    pageStatusEl.textContent = "No active tab found.";
    return;
  }

  const platform = detectPlatform(tab.url);
  if (!platform) {
    pageStatusEl.textContent =
      "Open an eBay search/listing or Facebook Marketplace item page.";
    return;
  }

  activePlatform = platform;

  if (platform === "ebay") {
    const pageKind = getEbayPageKind(tab.url);
    const soldHint = tab.url.includes("LH_Sold=1") ? " · sold filter" : "";
    if (pageKind === "search") {
      pageStatusEl.textContent = `Ready on eBay search results${soldHint}.`;
      scrollHintEl.classList.remove("hidden");
      captureBtn.textContent = "Capture visible eBay comps";
    } else {
      pageStatusEl.textContent = "Ready on eBay listing page.";
      captureBtn.textContent = "Capture this listing";
    }
  } else {
    pageStatusEl.textContent = "Ready on Facebook Marketplace listing page.";
    captureBtn.textContent = "Capture this listing";
  }

  captureBtn.disabled = false;

  captureBtn.addEventListener("click", async () => {
    captureBtn.disabled = true;
    const originalLabel = captureBtn.textContent;
    captureBtn.textContent = "Capturing…";

    try {
      if (activePlatform === "ebay") {
        const result = await runEbayCapture(tab.id);
        const batch = result?.batch;
        const stats = result?.stats;

        if (!batch || batch.schemaVersion !== "1.0") {
          showToast("Capture failed — reload the eBay page and try again.");
          return;
        }

        currentCompBatch = batch;
        currentListingBatch = null;
        renderEbayStats(
          stats ?? {
            capturedThisRun: batch.comps.length,
            validComps: batch.comps.length,
            duplicateRows: 0,
            skippedRows: 0,
          }
        );
        renderEbayPreview(batch);

        const scanned = stats?.scannedRows ?? batch.comps.length;
        captureMetaEl.textContent = `Scanned ${scanned} row${scanned === 1 ? "" : "s"} · query: ${batch.searchQuery || "—"}`;

        if (getEbayPageKind(tab.url) === "search" && batch.comps.length > 0) {
          showToast("Captured — scroll for more, then capture again if needed.");
        }
      } else {
        const result = await runFacebookCapture(tab.id);
        const batch = result?.batch;

        if (!batch || batch.schemaVersion !== "1.0") {
          showToast("Capture failed — reload the Facebook listing and try again.");
          return;
        }

        currentListingBatch = batch;
        currentCompBatch = null;
        statsPanel.classList.add("hidden");
        renderListingPreview(batch);

        captureMetaEl.textContent = batch.selectorFallback
          ? "Fallback capture — visible page text + URL only."
          : `Captured ${batch.platform} listing fields.`;
      }

      previewSection.classList.remove("hidden");
      captureMetaEl.classList.remove("hidden");
      showExportActions();
    } catch (error) {
      console.error(error);
      showToast("Capture error — check the page and retry.");
    } finally {
      captureBtn.disabled = false;
      captureBtn.textContent = originalLabel;
    }
  });

  sendBtn.addEventListener("click", async () => {
    sendBtn.disabled = true;
    const originalLabel = sendBtn.textContent;
    sendBtn.textContent = "Sending…";

    try {
      if (activePlatform === "ebay" && currentCompBatch) {
        const result = await sendBatchToGoblin(currentCompBatch);
        if (result.ok) {
          showToast(
            `Sent ${currentCompBatch.comps.length} comps to Marketplace Goblin — confirm import there.`
          );
        } else {
          showToast(result.error ?? "Send failed — use Copy JSON as a fallback.");
        }
      } else if (activePlatform === "facebook" && currentListingBatch) {
        const result = await sendListingBatchToGoblin(currentListingBatch);
        if (result.ok) {
          showToast(
            "Sent listing to Marketplace Goblin — review and confirm there."
          );
        } else {
          showToast(result.error ?? "Send failed — use Copy JSON as a fallback.");
        }
      }
    } catch (error) {
      console.error(error);
      showToast("Send failed — use Copy JSON as a fallback.");
    } finally {
      sendBtn.disabled = !hasExportableCapture();
      sendBtn.textContent = originalLabel;
    }
  });

  copyBtn.addEventListener("click", async () => {
    const payload =
      activePlatform === "ebay" ? currentCompBatch : currentListingBatch;
    if (!payload) return;

    const json = JSON.stringify(payload, null, 2);

    try {
      await navigator.clipboard.writeText(json);
      showToast("Copied JSON — paste into Marketplace Goblin as a fallback.");
    } catch {
      showToast("Clipboard failed — select and copy manually from devtools.");
    }
  });
}

init();
