/** @type {import('../lib/schema.js').CompCaptureBatch | null} */
let currentBatch = null;

const pageStatusEl = document.getElementById("page-status");
const captureBtn = document.getElementById("capture-btn");
const captureMetaEl = document.getElementById("capture-meta");
const previewSection = document.getElementById("preview");
const previewList = document.getElementById("preview-list");
const copyBtn = document.getElementById("copy-btn");
const toastEl = document.getElementById("toast");

function isEbaySearchPage(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("ebay.com")) return false;
    return parsed.pathname.includes("/sch/") || parsed.pathname.includes("/b/");
  } catch {
    return false;
  }
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.remove("hidden");
  window.setTimeout(() => {
    toastEl.classList.add("hidden");
  }, 3000);
}

function renderPreview(batch) {
  previewList.innerHTML = "";

  if (batch.comps.length === 0) {
    const empty = document.createElement("li");
    empty.className = "preview-meta";
    empty.textContent = "No visible listing cards found on this page.";
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
    meta.innerHTML = `<span class="${typeClass}">${comp.listingType}</span> · $${comp.price.toFixed(2)} · ${comp.platform}`;

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

  if (!isEbaySearchPage(tab.url)) {
    pageStatusEl.textContent =
      "Open an eBay search results page (/sch/) with visible listings, then try again.";
    return;
  }

  const soldHint = tab.url.includes("LH_Sold=1") ? " (sold filter detected)" : "";
  pageStatusEl.textContent = `Ready on eBay search${soldHint}.`;
  captureBtn.disabled = false;

  captureBtn.addEventListener("click", async () => {
    captureBtn.disabled = true;
    captureBtn.textContent = "Capturing…";

    try {
      const batch = await runCapture(tab.id);
      if (!batch || batch.schemaVersion !== "1.0") {
        showToast("Capture failed — reload the eBay page and try again.");
        return;
      }

      currentBatch = batch;
      renderPreview(batch);

      previewSection.classList.remove("hidden");
      captureMetaEl.classList.remove("hidden");
      captureMetaEl.textContent = `${batch.comps.length} comp${batch.comps.length === 1 ? "" : "s"} captured · query: ${batch.searchQuery || "—"}`;

      copyBtn.classList.remove("hidden");
      copyBtn.disabled = batch.comps.length === 0;
    } catch (error) {
      console.error(error);
      showToast("Capture error — check the eBay tab and retry.");
    } finally {
      captureBtn.disabled = false;
      captureBtn.textContent = "Capture visible eBay comps";
    }
  });

  copyBtn.addEventListener("click", async () => {
    if (!currentBatch) return;

    const json = JSON.stringify(currentBatch, null, 2);

    try {
      await navigator.clipboard.writeText(json);
      showToast(`Copied ${currentBatch.comps.length} comps — paste into Marketplace Goblin.`);
    } catch {
      showToast("Clipboard failed — select and copy manually from devtools.");
    }
  });
}

init();
