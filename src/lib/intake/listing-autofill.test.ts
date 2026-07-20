import { describe, expect, it, vi, afterEach } from "vitest";
import { attemptListingAutofill } from "@/lib/intake/listing-autofill";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("attemptListingAutofill", () => {
  it("succeeds when fetch returns listing metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        url: "https://www.ebay.com/itm/1",
        text: async () => `
          <meta property="og:title" content="Test Camera Body" />
          <meta property="product:price:amount" content="120" />
          <meta property="og:description" content="Shutter count low." />
        `,
      })
    );

    const result = await attemptListingAutofill("https://www.ebay.com/itm/1");

    expect(result.success).toBe(true);
    expect(result.parseResult?.fields.itemName).toBe("Test Camera Body");
    expect(result.parseResult?.fields.askingPrice).toBe(120);
    expect(result.imageUrls).toEqual([]);
    expect(result.diagnostics.some((line) => line.includes("parser"))).toBe(true);
  });

  it("fails gracefully when browser blocks fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    );

    const result = await attemptListingAutofill("https://www.ebay.com/itm/1");

    expect(result.success).toBe(false);
    expect(result.diagnostics[0]).toMatch(/CORS/i);
  });

  it("rejects invalid urls", async () => {
    const result = await attemptListingAutofill("not-a-url");
    expect(result.success).toBe(false);
    expect(result.diagnostics[0]).toMatch(/Invalid/i);
  });
});
