# Marketplace Goblin — Project State

Last updated: 2026-06-08 (Listing Autofill v1)

## Product intent

Client-only marketplace flip assistant: appraise deals, add comps, haggle scripts, and **prefill from listing URLs** when the browser allows. No backend, proxies, scraping services, or paid APIs.

## Implemented features

- Deal form, Quick Estimate, analysis, verdict, Brain Mode
- Screenshot Intake + OCR + listing parser
- Manual Comparable Sales + Haggle Mode
- Marketplace Link Intake (store URL, platform badge, Open Listing)
- **Listing Autofill v1**
  - Paste URL → **Attempt Autofill** (browser `fetch`, CORS-only)
  - Extract og/meta title, price, description, image URLs from HTML
  - Feed text into existing `parseListingWithConfidence` pipeline
  - Prefill confirm dialog (no overwrite without consent)
  - Extraction source badges: **URL Autofill** | **OCR** | **Manual**
  - Diagnostics on success/failure (incl. CORS blocked)
- `getDealViewModel()` for derived UI data

## Architecture summary

```
Listing URL → fetch (CORS) → HTML meta extract → parser text
  → parseListingWithConfidence → review → PrefillConfirmDialog → DealForm

Screenshot / paste → OCR or manual → same parser → same confirm flow
```

Autofill never calls a backend. Fails gracefully when CORS blocks fetch.

## Data model summary

**`DealInput.listingUrl`** — optional, normalized on save.

**Intake sources** (`IntakeExtractionSource`): `url_autofill`, `ocr`, `manual` — UI only, not persisted.

## localStorage schema

Unchanged: `marketplace-goblin-deals` → `SavedDeal[]` with optional `listingUrl`.

## Key modules

| Module | Role |
|--------|------|
| `listing-url-fetch.ts` | Browser fetch + CORS failure messages |
| `listing-html-extract.ts` | og:/meta/JSON-LD regex extraction |
| `listing-autofill.ts` | Orchestrate fetch → extract → parser |
| `listing-url-intake.tsx` | Autofill UI + diagnostics |
| `listing-parser.ts` | Shared deterministic field parser |

## Known risks / technical debt

- Most marketplace sites block CORS — autofill works only when allowed.
- Price/title from generic meta; no page-specific scrapers.
- Image URLs shown as previews only; not saved on deal.

## Recent changes

- Listing Autofill v1 + intake source labels
- URL field moved to `ListingUrlIntake` (synced with form state)
- 47 unit tests passing

## Verification

```bash
npm run test && npm run build && npm run lint
```

Manual: paste URL → Attempt Autofill → review fields → Fill Analyze Form → confirm conflicts.

## Recommended next step

Allow user to paste fetched HTML manually when CORS blocks (clipboard import path).
