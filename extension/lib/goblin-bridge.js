/**
 * Same-browser postMessage bridge from extension popup → Marketplace Goblin tab.
 * Local prototype only — no accounts, servers, or persistent pairing.
 */

export const EXTENSION_IMPORT_MESSAGE_TYPE = "MARKETPLACE_GOBLIN_COMP_IMPORT";
export const EXTENSION_IMPORT_ACK_MESSAGE_TYPE =
  "MARKETPLACE_GOBLIN_COMP_IMPORT_ACK";

export const GOBLIN_TAB_URL_PATTERNS = [
  "http://localhost/*",
  "http://127.0.0.1/*",
];

const DELIVERY_TIMEOUT_MS = 4000;

/**
 * @param {import('./schema.js').CompCaptureBatch} batch
 * @returns {Promise<{ ok: boolean, error?: string, tabCount?: number }>}
 */
export async function sendBatchToGoblin(batch) {
  if (!batch || batch.schemaVersion !== "1.0") {
    return { ok: false, error: "Invalid capture batch." };
  }

  if (!Array.isArray(batch.comps) || batch.comps.length === 0) {
    return { ok: false, error: "Capture batch has no comps to send." };
  }

  const tabs = await chrome.tabs.query({ url: GOBLIN_TAB_URL_PATTERNS });
  if (tabs.length === 0) {
    return {
      ok: false,
      error:
        "Open Marketplace Goblin on localhost and click Listen for Extension Import.",
      tabCount: 0,
    };
  }

  let lastError = "Marketplace Goblin is not listening for extension import.";

  for (const tab of tabs) {
    if (!tab.id) continue;

    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: deliverImportMessage,
        args: [EXTENSION_IMPORT_MESSAGE_TYPE, batch, DELIVERY_TIMEOUT_MS],
      });

      const delivery = result?.result;
      if (delivery?.ok) {
        return { ok: true, tabCount: tabs.length };
      }
      if (delivery?.error) {
        lastError = delivery.error;
      }
    } catch {
      // Try the next Goblin tab.
    }
  }

  return { ok: false, error: lastError, tabCount: tabs.length };
}

/**
 * Runs inside the Goblin tab. Posts the import message and waits for an ack.
 * @param {string} messageType
 * @param {unknown} payload
 * @param {number} timeoutMs
 */
function deliverImportMessage(messageType, payload, timeoutMs) {
  return new Promise((resolve) => {
    const origin = window.location.origin;

    function cleanup() {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
    }

    function onMessage(event) {
      if (event.source !== window) return;
      if (event.origin !== origin) return;
      if (event.data?.type !== "MARKETPLACE_GOBLIN_COMP_IMPORT_ACK") return;

      cleanup();
      resolve({
        ok: Boolean(event.data.ok),
        error: typeof event.data.error === "string" ? event.data.error : undefined,
      });
    }

    const timer = window.setTimeout(() => {
      cleanup();
      resolve({
        ok: false,
        error: "Marketplace Goblin is not listening for extension import.",
      });
    }, timeoutMs);

    window.addEventListener("message", onMessage);
    window.postMessage({ type: messageType, payload }, origin);
  });
}
