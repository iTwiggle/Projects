# Marketplace Goblin — Project State

Last updated: 2026-06-08 (Smart Comp Builder v1)

## Product intent

Client-only flip assistant: appraise deals, build comps fast, negotiate, optional URL autofill. No backend, scraping services, or paid APIs.

## Implemented features

- Deal form, analysis, verdict, Brain Mode, Haggle Mode
- Screenshot/OCR intake, Listing URL autofill (CORS-only)
- Manual Comparable Sales + comp-driven resale estimate
- **Smart Comp Builder v1**
  - **Paste Comp Text** in Comparable Sales panel
  - Batch paste (blank-line separated): eBay sold, Marketplace, Craigslist, auction text
  - Parses title, price, condition, sold/listed, platform, notes
  - Preview + edit before import; confidence pills per field
  - Reuses `parseListingWithConfidence` from listing parser
- `getDealViewModel()` for derived UI

## Architecture summary

```
Paste comp text → split blocks → parseListingWithConfidence + platform/status hints
  → ParsedCompDraft[] → user edits → ComparableSale[] → comp calculations
```

## Data model summary

**`ComparableSale`** unchanged. Comp paste is ephemeral until imported into deal comps array (session or saved deal).

## localStorage schema

Unchanged: `SavedDeal.comps[]` persists imported comps with deals.

## Key modules

| Module | Role |
|--------|------|
| `comp-text-parser.ts` | Batch split, platform/status detection, draft parsing |
| `paste-comp-text.tsx` | Paste UI, preview, import |
| `comp-calculations.ts` | Stats after import (unchanged) |

## Known risks / technical debt

- Platform/status detection is keyword-based.
- Parser tuned for deal listings; odd paste formats may need manual edit.
- Paste comp UI always visible below add-comp form.

## Recent changes

- Smart Comp Builder v1 + 8 parser tests (53 total)
- Integrated into `ComparableSalesPanel` on Analyze + Deal Detail

## Verification

```bash
npm run test && npm run build && npm run lint
```

Manual: paste 2–3 comps separated by blank lines → Preview → edit → Import → enable comps estimate.

## Recommended next step

Remember last-used comp platform per deal, or export comps as shareable text.
