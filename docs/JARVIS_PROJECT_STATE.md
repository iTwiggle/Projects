# Marketplace Goblin — Project State

Last updated: 2026-06-08 (Marketplace Link Intake v1)

## Product intent

Help marketplace flippers appraise deals and negotiate with confidence. Client-only MVP — paste listing URLs, enter details, add comps, get haggle scripts. No backend, scraping, or AI APIs.

## Implemented features

- Deal form + Quick Estimate + optional **listing URL**
- Analysis engine, goblin verdict, Brain Mode
- Screenshot Intake + OCR + listing parser
- Manual Comparable Sales v1
- Haggle Mode v1
- **Marketplace Link Intake v1**
  - Optional listing URL on deal form
  - Stored on `SavedDeal` when valid (http/https)
  - Platform badge: Facebook Marketplace, Craigslist, OfferUp, eBay, Unknown
  - Deal Detail: URL display + **Open Listing** button
  - Hostname detection only — no fetch/scrape
- **`getDealViewModel()`** — includes `listing` metadata

## Architecture summary

```
DealInput.listingUrl → normalizeDealInput → localStorage
                      → resolveListingLink() → DealViewModel.listing → UI
```

## Data model summary

**`DealInput` / `SavedDeal`** adds `listingUrl: string | null`.

**`ListingLinkInfo`** (runtime): `url`, `isValid`, `hasLink`, `platform`, `platformLabel`, `hostname`.

**`DealViewModel`** = prior fields + `listing`.

## localStorage schema

| Key | Value |
|-----|-------|
| `marketplace-goblin-deals` | `SavedDeal[]` JSON |

New field `listingUrl` optional; missing on legacy deals → `null` on load.

## Analysis pipeline

Unchanged for resale/haggle. Listing link is display metadata only.

## Known risks / technical debt

- Platform detection is hostname/path heuristic (no scraping).
- Invalid URLs typed in form are not persisted (normalized to `null`).
- Generic Facebook URLs without `/marketplace` still map to Facebook Marketplace.

## Recent changes

- `listing-url.ts` validation + platform detection + tests
- Deal form URL field with inline validation
- `ListingLinkPanel` on Deal Detail
- `DealViewModel.listing`

## Verification

```bash
npm run test
npm run build
npm run lint
```

Manual: paste eBay URL on form → analyze → save → Detail shows badge + Open Listing.

## Recommended next step

Show platform badge on **DealCard** when a listing URL exists, or parse URL query params for future prefill (still no scraping).
