import {
  isCompCaptureBatch,
  parseCompCaptureJson,
} from "@/lib/intake/comp-capture-import";
import type { CompCaptureBatch } from "@/lib/types/comp-capture";

export const EXTENSION_IMPORT_MESSAGE_TYPE =
  "MARKETPLACE_GOBLIN_COMP_IMPORT" as const;

export const EXTENSION_IMPORT_ACK_MESSAGE_TYPE =
  "MARKETPLACE_GOBLIN_COMP_IMPORT_ACK" as const;

/** Inactivity timeout while Goblin listens for extension imports. */
export const EXTENSION_IMPORT_LISTEN_TIMEOUT_MS = 120_000;

/** Max serialized batch size accepted from the extension bridge. */
export const MAX_EXTENSION_IMPORT_PAYLOAD_BYTES = 100 * 1024;

export const GOBLIN_TAB_URL_PATTERNS = [
  "http://localhost/*",
  "http://127.0.0.1/*",
] as const;

export interface ExtensionImportAckMessage {
  type: typeof EXTENSION_IMPORT_ACK_MESSAGE_TYPE;
  ok: boolean;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function measureJsonUtf8Bytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

export function isTrustedExtensionImportOrigin(
  eventOrigin: string,
  pageOrigin: string
): boolean {
  if (!eventOrigin || !pageOrigin) return false;
  return eventOrigin === pageOrigin;
}

export function isExtensionImportMessage(
  data: unknown
): data is { type: typeof EXTENSION_IMPORT_MESSAGE_TYPE; payload: unknown } {
  return (
    isRecord(data) && data.type === EXTENSION_IMPORT_MESSAGE_TYPE && "payload" in data
  );
}

export function isExtensionImportAckMessage(
  data: unknown
): data is ExtensionImportAckMessage {
  return (
    isRecord(data) &&
    data.type === EXTENSION_IMPORT_ACK_MESSAGE_TYPE &&
    typeof data.ok === "boolean"
  );
}

export function createExtensionImportAck(
  ok: boolean,
  error?: string
): ExtensionImportAckMessage {
  return {
    type: EXTENSION_IMPORT_ACK_MESSAGE_TYPE,
    ok,
    ...(error ? { error } : {}),
  };
}

export function postExtensionImportAck(ok: boolean, error?: string): void {
  if (typeof window === "undefined") return;
  window.postMessage(
    createExtensionImportAck(ok, error),
    window.location.origin
  );
}

/**
 * Validate an extension postMessage payload before preview/import.
 * Reuses CompCaptureBatch parsing rules from paste/JSON import.
 */
export function validateExtensionImportMessage(
  data: unknown,
  maxBytes: number = MAX_EXTENSION_IMPORT_PAYLOAD_BYTES
): { batch: CompCaptureBatch | null; error: string | null } {
  if (!isExtensionImportMessage(data)) {
    return { batch: null, error: "Unknown or malformed extension message." };
  }

  const { payload } = data;

  if (!isCompCaptureBatch(payload)) {
    return {
      batch: null,
      error: "Payload must be a CompCaptureBatch with schemaVersion, source, and comps.",
    };
  }

  let payloadBytes = 0;
  try {
    payloadBytes = measureJsonUtf8Bytes(payload);
  } catch {
    return { batch: null, error: "Unable to measure payload size." };
  }

  if (payloadBytes > maxBytes) {
    return {
      batch: null,
      error: `Payload exceeds maximum of ${maxBytes} bytes.`,
    };
  }

  const parsed = parseCompCaptureJson(JSON.stringify(payload));
  if (parsed.error || !parsed.batch) {
    return { batch: null, error: parsed.error ?? "Invalid comp capture batch." };
  }

  return { batch: parsed.batch, error: null };
}
