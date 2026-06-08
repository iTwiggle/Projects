# Marketplace Goblin — Project State

Last updated: 2026-06-08 (Manual Comparable Sales v1)

## Product intent

Help marketplace flippers answer: **Is this actually a good deal?** Client-only MVP — no backend, auth, AI APIs, or scraping. Users enter listing details, get deterministic analysis, and can replace rough resale estimates with **manual comps**.

## Implemented features

- Deal form + optional `knownResaleValue` (Quick Estimate when blank)
- Analysis engine: profit, ROI, risk, flip score, time-to-sell
- Goblin verdict + Goblin Brain Mode (5 lenses)
- Screenshot Intake + browser OCR + listing parser
- **Manual Comparable Sales v1**
  - Panel on **Analyze** (temporary comps) and **Deal Detail** (persisted)
  - Fields: title, platform, price, condition, notes, sold/listed toggle
  - Stats: average, median, low/high, count, confidence
  - 3+ comps → “Use comps as resale estimate” → **User comps** label via view model
  - Confidence: medium (3–4), high (5+ sold), downgraded if mostly listed
  - Manual resale overrides comps with warning
- Saved deals + dashboard
- **`getDealViewModel()` / `getPreviewViewModel()`** — single derived-data path

## Architecture summary

```
SavedDeal (localStorage)
  → getDealViewModel() → DealCard, DealDetail, dashboard

Analyze preview (unsaved)
  → getPreviewViewModel(input, comps, useCompsForResale) → same pipeline
```

Resale priority: **manual** → **comps** (if enabled, 3+ valid) → **estimated**.

UI reads derived data only through view models. Cached `analysis`/`verdict` still written to localStorage for schema compat.

## Data model summary

**`SavedDeal`** = `DealInput` + `id`, timestamps, `comps[]`, `useCompsForResale`, `analysis`, `verdict`.

**`ComparableSale`** = `id`, `title`, `platform`, `price`, `condition`, `notes`, `listingType` (`sold`|`listed`).

**`DealViewModel`** = `input`, `comps`, `compSummary`, `resolved`, `analysis`, `verdict`, `display` (labels, badges, warnings).

## localStorage schema

| Key | Value |
|-----|-------|
| `marketplace-goblin-deals` | `SavedDeal[]` JSON |

Legacy `estimatedResaleValue` → `knownResaleValue` on load. Comps default to `[]`; `useCompsForResale` defaults `false`.

## Analysis pipeline

1. `normalizeDealInput`
2. `{ comps, useCompsForResale }`
3. `resolveDeal` → resale estimate (manual / comps / estimated)
4. `analyzeDeal` → metrics
5. `getGoblinVerdict` → verdict
6. `calculateCompSummary` + `display.warnings`

## Known risks / technical debt

- View model recomputed per card render (memoize if lists grow).
- Weak comp field validation on load (`platform`, `listingType`).
- Brain Mode bypasses view-model warnings.
- README partially outdated.

## Recent changes

- Comparable Sales panel + comp calculations + persistence
- `getDealViewModel` / `getPreviewViewModel` with comp integration
- Manual-resale-overrides-comps warning in `display.warnings`
- `DealEstimateWarnings` component wired to Analyze + Detail

## Verification

```bash
npm run test    # comp + view-model tests
npm run build
npm run lint
```

Manual: add 3 comps on Analyze → enable comps estimate → save → reopen Detail → comps persist; set manual resale with comps enabled → see override warning.

## Recommended next step

Surface comp count badge on **DealCard** when comps exist, or add schema version for future engine migrations.
