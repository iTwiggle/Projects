import { isValidListingUrl, normalizeListingUrl } from "@/lib/intake/listing-url";

export type ListingFetchFailureReason =
  | "invalid_url"
  | "cors_blocked"
  | "network_error"
  | "http_error"
  | "empty_response";

export type ListingFetchResult =
  | { ok: true; html: string; finalUrl: string }
  | { ok: false; reason: ListingFetchFailureReason; message: string };

export async function fetchListingHtml(url: string): Promise<ListingFetchResult> {
  const normalized = normalizeListingUrl(url);
  if (!normalized || !isValidListingUrl(normalized)) {
    return {
      ok: false,
      reason: "invalid_url",
      message: "Enter a valid http(s) listing URL before attempting autofill.",
    };
  }

  try {
    const response = await fetch(normalized, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      redirect: "follow",
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: "http_error",
        message: `Listing page returned HTTP ${response.status}. Autofill needs readable page HTML.`,
      };
    }

    const html = await response.text();
    if (!html.trim()) {
      return {
        ok: false,
        reason: "empty_response",
        message: "Listing page returned empty content.",
      };
    }

    return {
      ok: true,
      html,
      finalUrl: response.url || normalized,
    };
  } catch {
    return {
      ok: false,
      reason: "cors_blocked",
      message:
        "Browser blocked cross-origin fetch (CORS). Try pasting listing text or a screenshot instead.",
    };
  }
}
