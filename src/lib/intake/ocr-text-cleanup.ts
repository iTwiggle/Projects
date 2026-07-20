/**
 * Deterministic OCR text cleanup before listing parse.
 * Preserves meaning while fixing common mobile-screenshot OCR glitches.
 */

export interface OcrCleanupResult {
  /** Normalized text fed to the listing parser. */
  cleaned: string;
  /** Raw OCR output unchanged. */
  original: string;
  /** True when cleanup changed the text. */
  wasModified: boolean;
}

function normalizeLineBreaks(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u2028|\u2029/g, "\n")
    .replace(/([a-z0-9,])\n([a-z0-9])/gi, "$1 $2")
    .replace(/([^\n])\n([,.;:!?])/g, "$1$2")
    .replace(/\n{3,}/g, "\n\n");
}

function collapseWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t\f\v]+/g, " ").trim())
    .join("\n")
    .trim();
}

function fixCommonOcrPriceMistakes(text: string): string {
  let result = text;

  result = result.replace(/\$\s*(\d)\s*[Ss$]\s*(\d?)/g, (_, tens, ones) => {
    return `$${tens}${ones || "5"}`;
  });

  result = result.replace(/\$\s*[Il|]\s*(\d{2,})/g, "$$$1");

  result = result.replace(
    /\$\s*(\d)\s+(\d)(?=\s*(?:firm|obo|cash|usd|\.|,|$))/gim,
    "$$$1$2"
  );

  result = result.replace(
    /(?:^|[\s(])(\d)\s+(\d{2})(?=\s*(?:firm|obo|cash|usd|\.|,|$))/gim,
    "$1$2"
  );

  result = result.replace(/\$\s+(\d)/g, "$$$1");
  result = result.replace(/(\$\d+)(OBO|firm|cash)\b/gi, "$1 $2");
  result = result.replace(/(\d)\s*\.\s*(\d{2})\b/g, "$1.$2");
  result = result.replace(/(\d),(\d{3})\b/g, "$1$2");

  result = result.replace(/\bO\s*B\s*O\b/gi, "OBO");
  result = result.replace(/\bf\s*r\s*e\s*e\b/gi, "free");
  result = result.replace(/\bf\s*i\s*r\s*m\b/gi, "firm");

  result = result.replace(/\b1isted\b/gi, "listed");
  result = result.replace(/\bpr1ce\b/gi, "price");
  result = result.replace(/\bas[kk]ing\b/gi, "asking");

  return result;
}

export function cleanupOcrText(original: string): OcrCleanupResult {
  const raw = original.trim();
  if (!raw) {
    return { cleaned: "", original: raw, wasModified: false };
  }

  let cleaned = raw;
  cleaned = normalizeLineBreaks(cleaned);
  cleaned = fixCommonOcrPriceMistakes(cleaned);
  cleaned = collapseWhitespace(cleaned);

  return {
    cleaned,
    original: raw,
    wasModified: cleaned !== raw,
  };
}
