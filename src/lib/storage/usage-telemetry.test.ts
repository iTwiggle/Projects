import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}
import {
  getAverageCompsPerDeal,
  isEbayCapturePlatform,
  loadUsageTelemetry,
  recordCompImport,
  recordDealAnalyzed,
  recordDealSaved,
  recordEbayCaptureImported,
  recordEbayCaptureReceived,
  recordFacebookCaptureImported,
  recordFacebookCaptureReceived,
  recordListingImported,
  resetUsageTelemetry,
} from "@/lib/storage/usage-telemetry";

describe("usage-telemetry", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageMock());
    resetUsageTelemetry();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts empty and persists increments", () => {
    recordListingImported("extension");
    recordFacebookCaptureReceived();
    recordFacebookCaptureImported();
    recordEbayCaptureReceived();
    recordEbayCaptureImported();
    recordCompImport(3, "extension");
    recordDealAnalyzed("estimated");
    recordDealAnalyzed("comps");
    recordDealSaved(4);

    const stats = loadUsageTelemetry();
    expect(stats.listingsImported).toBe(1);
    expect(stats.listingsImportedBySource.extension).toBe(1);
    expect(stats.facebookCapturesReceived).toBe(1);
    expect(stats.facebookCapturesImported).toBe(1);
    expect(stats.ebayCapturesReceived).toBe(1);
    expect(stats.ebayCapturesImported).toBe(1);
    expect(stats.compImportEvents).toBe(1);
    expect(stats.compsImported).toBe(3);
    expect(stats.dealsAnalyzed).toBe(2);
    expect(stats.quickEstimateUsed).toBe(1);
    expect(stats.compEstimateUsed).toBe(1);
    expect(stats.dealsSaved).toBe(1);
    expect(getAverageCompsPerDeal(stats)).toBe(4);
  });

  it("resets telemetry without touching unrelated keys", () => {
    localStorage.setItem("other-key", "keep");
    recordDealSaved(2);
    resetUsageTelemetry();

    expect(loadUsageTelemetry().dealsSaved).toBe(0);
    expect(loadUsageTelemetry().compsImported).toBe(0);
    expect(localStorage.getItem("other-key")).toBe("keep");
  });

  it("detects eBay capture platforms", () => {
    expect(isEbayCapturePlatform("eBay")).toBe(true);
    expect(isEbayCapturePlatform("Facebook Marketplace")).toBe(false);
  });
});
