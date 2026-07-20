import { describe, expect, it } from "vitest";
import { cleanupOcrText } from "@/lib/intake/ocr-text-cleanup";

describe("cleanupOcrText", () => {
  it("normalizes weird line breaks and duplicate whitespace", () => {
    const result = cleanupOcrText("Makita  Drill\r\n\r\n\n$4S  OBO");
    expect(result.cleaned).toContain("Makita Drill");
    expect(result.cleaned).toContain("$45 OBO");
    expect(result.wasModified).toBe(true);
  });

  it("fixes OCR price mistakes", () => {
    const result = cleanupOcrText("listed for $4 5 firm");
    expect(result.cleaned.toLowerCase()).toContain("listed for $45 firm");
  });

  it("preserves original OCR text", () => {
    const raw = "Vintage  Lamp\n$2O firm";
    const result = cleanupOcrText(raw);
    expect(result.original).toBe(raw);
    expect(result.cleaned).not.toBe(raw);
  });

  it("normalizes free and firm spacing", () => {
    const result = cleanupOcrText("Dining table\nf r e e\npickup only");
    expect(result.cleaned).toContain("free");
    expect(result.cleaned).toContain("pickup only");
  });

  it("returns empty for blank input", () => {
    const result = cleanupOcrText("   ");
    expect(result.cleaned).toBe("");
    expect(result.wasModified).toBe(false);
  });
});
