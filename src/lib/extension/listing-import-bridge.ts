import {
  isMarketplaceListingCaptureBatch,
  parseMarketplaceListingCaptureJson,
} from "@/lib/intake/marketplace-listing-capture-import";
import type { MarketplaceListingCaptureBatch } from "@/lib/types/marketplace-listing-capture";
import { measureJsonUtf8Bytes } from "@/lib/extension/comp-import-bridge";

export const EXTENSION_LISTING_IMPORT_MESSAGE_TYPE =
  "MARKETPLACE_GOBLIN_LISTING_IMPORT" as const;

export const EXTENSION_LISTING_IMPORT_ACK_MESSAGE_TYPE =
  "MARKETPLACE_GOBLIN_LISTING_IMPORT_ACK" as const;

export const EXTENSION_LISTING_LISTEN_TIMEOUT_MS = 120_000;

export const MAX_EXTENSION_LISTING_PAYLOAD_BYTES = 100 * 1024;

export interface ExtensionListingImportAckMessage {
  type: typeof EXTENSION_LISTING_IMPORT_ACK_MESSAGE_TYPE;
  ok: boolean;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isTrustedExtensionListingImportOrigin(
  eventOrigin: string,
  pageOrigin: string
): boolean {
  if (!eventOrigin || !pageOrigin) return false;
  return eventOrigin === pageOrigin;
}

export function isExtensionListingImportMessage(
  data: unknown
): data is {
  type: typeof EXTENSION_LISTING_IMPORT_MESSAGE_TYPE;
  payload: unknown;
} {
  return (
    isRecord(data) &&
    data.type === EXTENSION_LISTING_IMPORT_MESSAGE_TYPE &&
    "payload" in data
  );
}

export function createExtensionListingImportAck(
  ok: boolean,
  error?: string
): ExtensionListingImportAckMessage {
  return {
    type: EXTENSION_LISTING_IMPORT_ACK_MESSAGE_TYPE,
    ok,
    ...(error ? { error } : {}),
  };
}

export function postExtensionListingImportAck(
  ok: boolean,
  error?: string
): void {
  if (typeof window === "undefined") return;
  window.postMessage(
    createExtensionListingImportAck(ok, error),
    window.location.origin
  );
}

export function validateExtensionListingImportMessage(
  data: unknown,
  maxBytes: number = MAX_EXTENSION_LISTING_PAYLOAD_BYTES
): { batch: MarketplaceListingCaptureBatch | null; error: string | null } {
  if (!isExtensionListingImportMessage(data)) {
    return { batch: null, error: "Unknown or malformed extension message." };
  }

  const { payload } = data;

  if (!isMarketplaceListingCaptureBatch(payload)) {
    return {
      batch: null,
      error:
        "Payload must be a MarketplaceListingCaptureBatch with schemaVersion, source, and listing.",
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

  const parsed = parseMarketplaceListingCaptureJson(JSON.stringify(payload));
  if (parsed.error || !parsed.batch) {
    return { batch: null, error: parsed.error ?? "Invalid listing capture batch." };
  }

  return { batch: parsed.batch, error: null };
}
