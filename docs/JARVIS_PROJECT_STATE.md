# Marketplace Goblin — Project State

Last updated: 2026-06-08 (deal view-model refactor)

## Product intent

Help marketplace flippers answer: **Is this actually a good deal?** Client-only MVP — no backend, auth, AI APIs, or scraping. Users enter listing details, get deterministic profit/ROI/risk analysis, goblin verdict, and optional comps-based resale estimates. Data lives in `localStorage`.

## Implemented features

- Deal input form + Quick Estimate (`knownResaleValue` optional)
- Deterministic analysis engine (profit, ROI, risk, flip score, time-to-sell)
- Goblin verdict (approved / caution / reject)
- Goblin Brain Mode (5 re-analysis lenses)
- Screenshot Intake + browser OCR + listing parser
- Manual Comparable Sales (add comps, use as resale estimate)
- Saved deals + treasure dashboard
- **`getDealViewModel()`** — single UI source of truth for derived deal data

## Architecture summary

```
SavedDeal (localStorage) → getDealViewModel() → UI components
                              ↓
                    normalizeDealInput + comps flags
                    resolveDeal → analyzeDeal → getGoblinVerdict
                    comp summary + display labels/warnings
```

- **Persisted:** user inputs, comps, flags, metadata, plus cached `analysis`/`verdict` (written on save/load refresh; **not read by UI**).
- **Derived (runtime):** everything from `getDealViewModel()`.
- **Analyze preview:** still uses `analyzeDeal()` directly (not saved yet).

## Data model summary

**`SavedDeal`** = `DealInput` + `id`, `createdAt`, `updatedAt`, `comps[]`, `useCompsForResale`, `analysis`, `verdict`.

**`DealViewModel`** = normalized `input`, `resolved`, `analysis`, `verdict`, `compSummary`, `display` (labels, badges, warnings).

## localStorage schema

| Key | Value |
|-----|-------|
| `marketplace-goblin-deals` | `JSON.stringify(SavedDeal[])` |

Legacy field `estimatedResaleValue` migrated to `knownResaleValue` on load. No schema version field. Cached `analysis`/`verdict` retained for backward compatibility.

## Analysis pipeline

1. `normalizeDealInput(deal)`
2. Options: `{ comps, useCompsForResale }`
3. Resale priority: **manual** → **comps** (if enabled, 3+ valid) → **estimated**
4. `analyzeDeal` → metrics + embedded `resaleEstimate`
5. `getGoblinVerdict` → verdict + reasoning

## Known risks / technical debt

- `getDealViewModel` runs per card render — fine at MVP scale; memoize if lists grow large.
- `ComparableSale.platform` typed as `string`; weak comp validation on load.
- Edit form can receive full `SavedDeal` as `initialValues` (extra keys in form state).
- README still partially outdated vs Quick Estimate / comps.
- Analyze flow does not use view model (intentional — unsaved session).

## Recent changes

- Added `src/lib/deal-view-model.ts` + tests.
- `DealCard`, `DealDetailDialog`, `calculateDashboardStats`, `StatsCards` now use view model.
- Migration always recomputes `analysis`/`verdict` on load (still persists them).
- `DashboardStats.bestDeal` slimmed to `{ itemName, potentialProfit }`.

## Verification

```bash
npm run test    # 25 passed
npm run build   # OK
npm run lint    # OK
```

Manual: save a deal → card and detail show matching profit/verdict; edit comps in detail → card updates after close; dashboard totals match sum of card profits.

## Recommended next step

**Memoize or batch view models** in `DealList` / dashboard if performance becomes an issue, or add a lightweight schema version + one-shot migration helper for future engine changes.
