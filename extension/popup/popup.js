/** @type {import('../lib/schema.js').CompCaptureBatch | null} */
let currentBatch = null;

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

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.remove("hidden");
  window.setTimeout(() => {
    toastEl.classList.add("hidden");
  }, 3500);
}

function renderStats(stats) {
  statCaptured.textContent = String(stats.capturedThisRun ?? 0);
  statValid.textContent = String(stats.validComps ?? 0);
  statDuplicates.textContent = String(stats.duplicateRows ?? 0);
  statSkipped.textContent = String(stats.skippedRows ?? 0);
  statsPanel.classList.remove("hidden");
}

function renderPreview(batch) {
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

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function injectCaptureScripts(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["lib/ebay-parser-global.js"],
  });
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content/ebay-capture.js"],
  });
}

async function runCapture(tabId) {
  await injectCaptureScripts(tabId);
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => globalThis.__marketplaceGoblinCaptureEbay?.(),
  });
  return result?.result ?? null;
}

async function init() {
  const tab = await getActiveTab();
  if (!tab?.id || !tab.url) {
    pageStatusEl.textContent = "No active tab found.";
    return;
  }

  const pageKind = getEbayPageKind(tab.url);
  if (!pageKind) {
    pageStatusEl.textContent =
      "Open an eBay search (/sch/) or listing (/itm/) page, then try again.";
    return;
  }

  const soldHint = tab.url.includes("LH_Sold=1") ? " · sold filter" : "";
  if (pageKind === "search") {
    pageStatusEl.textContent = `Ready on eBay search results${soldHint}.`;
    scrollHintEl.classList.remove("hidden");
    captureBtn.textContent = "Capture visible eBay comps";
  } else {
    pageStatusEl.textContent = "Ready on eBay listing page.";
    captureBtn.textContent = "Capture this listing";
  }

  captureBtn.disabled = false;

  captureBtn.addEventListener("click", async () => {
    captureBtn.disabled = true;
    const originalLabel = captureBtn.textContent;
    captureBtn.textContent = "Capturing…";

    try {
      const result = await runCapture(tab.id);
      const batch = result?.batch;
      const stats = result?.stats;

      if (!batch || batch.schemaVersion !== "1.0") {
        showToast("Capture failed — reload the eBay page and try again.");
        return;
      }

      currentBatch = batch;
      renderStats(
        stats ?? {
          capturedThisRun: batch.comps.length,
          validComps: batch.comps.length,
          duplicateRows: 0,
          skippedRows: 0,
        }
      );
      renderPreview(batch);

      previewSection.classList.remove("hidden");
      captureMetaEl.classList.remove("hidden");

      const scanned = stats?.scannedRows ?? batch.comps.length;
      captureMetaEl.textContent = `Scanned ${scanned} row${scanned === 1 ? "" : "s"} · query: ${batch.searchQuery || "—"}`;

      copyBtn.classList.remove("hidden");
      copyBtn.disabled = batch.comps.length === 0;

      if (pageKind === "search" && batch.comps.length > 0) {
        showToast("Captured — scroll for more, then capture again if needed.");
      }
    } catch (error) {
      console.error(error);
      showToast("Capture error — check the eBay tab and retry.");
    } finally {
      captureBtn.disabled = false;
      captureBtn.textContent = originalLabel;
    }
  });

  copyBtn.addEventListener("click", async () => {
    if (!currentBatch) return;

    const json = JSON.stringify(currentBatch, null, 2);

    try {
      await navigator.clipboard.writeText(json);
      showToast(
        `Copied ${currentBatch.comps.length} comps — paste into Marketplace Goblin.`
      );
    } catch {
      showToast("Clipboard failed — select and copy manually from devtools.");
    }
  });
}

init();
