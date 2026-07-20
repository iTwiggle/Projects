export type IntakeExtractionSource =
  | "url_autofill"
  | "ocr"
  | "manual"
  | "extension";

export const INTAKE_SOURCE_LABELS: Record<IntakeExtractionSource, string> = {
  url_autofill: "URL Autofill",
  ocr: "OCR",
  manual: "Manual",
  extension: "Extension Capture",
};
