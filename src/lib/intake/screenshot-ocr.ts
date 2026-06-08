export type OcrStatus =
  | "idle"
  | "checking"
  | "loading"
  | "recognizing"
  | "done"
  | "error";

export interface OcrProgress {
  status: OcrStatus;
  progress: number;
  message: string;
}

export interface OcrResult {
  text: string;
}

export interface OcrError {
  fallback: true;
  message: string;
}

function isWasmSupported(): boolean {
  if (typeof window === "undefined") return false;

  try {
    if (typeof WebAssembly !== "object") return false;
    if (typeof WebAssembly.instantiate !== "function") return false;
    return true;
  } catch {
    return false;
  }
}

export function isOcrAvailable(): boolean {
  return typeof window !== "undefined" && isWasmSupported();
}

async function loadImageElement(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image for OCR."));
    img.src = imageUrl;
  });
}

async function normalizeImageForOcr(imageUrl: string): Promise<string> {
  const img = await loadImageElement(imageUrl);
  const maxEdge = 1600;
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));

  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return imageUrl;

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}

export async function extractTextFromScreenshot(
  imageUrl: string,
  onProgress?: (update: OcrProgress) => void
): Promise<OcrResult | OcrError> {
  const report = (update: OcrProgress) => onProgress?.(update);

  if (!isOcrAvailable()) {
    return {
      fallback: true,
      message:
        "OCR is not available in this browser. Paste the listing text manually.",
    };
  }

  report({
    status: "checking",
    progress: 0,
    message: "Preparing goblin vision...",
  });

  let worker: { recognize: (image: string) => Promise<{ data: { text: string } }>; terminate: () => Promise<unknown> } | null = null;

  try {
    const { createWorker } = await import("tesseract.js");

    report({
      status: "loading",
      progress: 0.05,
      message: "Loading OCR engine (first run may take a moment)...",
    });

    worker = await createWorker("eng", 1, {
      logger: (message) => {
        if (message.status === "loading tesseract core") {
          report({
            status: "loading",
            progress: 0.1,
            message: "Loading OCR core...",
          });
        }
        if (message.status === "initializing tesseract") {
          report({
            status: "loading",
            progress: 0.2,
            message: "Initializing OCR...",
          });
        }
        if (message.status === "loading language traineddata") {
          report({
            status: "loading",
            progress: 0.35,
            message: "Loading English language pack...",
          });
        }
        if (message.status === "initializing api") {
          report({
            status: "loading",
            progress: 0.5,
            message: "Starting OCR engine...",
          });
        }
        if (message.status === "recognizing text") {
          report({
            status: "recognizing",
            progress: 0.5 + (message.progress ?? 0) * 0.5,
            message: `Reading screenshot... ${Math.round((message.progress ?? 0) * 100)}%`,
          });
        }
      },
    });

    const normalizedImage = await normalizeImageForOcr(imageUrl);

    report({
      status: "recognizing",
      progress: 0.55,
      message: "Reading screenshot...",
    });

    const result = await worker.recognize(normalizedImage);
    const text = result.data.text;

    if (!text) {
      return {
        fallback: true,
        message:
          "No readable text found. Try a clearer screenshot or paste the listing text manually.",
      };
    }

    report({
      status: "done",
      progress: 1,
      message: "Text extracted — review and edit below.",
    });

    return { text };
  } catch {
    return {
      fallback: true,
      message:
        "OCR failed or is too heavy for this device. Paste the listing text manually.",
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // Ignore worker cleanup errors
      }
    }
  }
}
