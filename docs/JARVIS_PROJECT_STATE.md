# Marketplace Goblin — Project State

Last updated: 2026-06-08 (Haggle Mode v1)

## Product intent

Help marketplace flippers answer: **Is this actually a good deal?** Client-only MVP. Users appraise listings, add comps, then get **negotiation guidance** — all deterministic, no backend/AI.

## Implemented features

- Deal form + Quick Estimate (`knownResaleValue` optional)
- Analysis engine: profit, ROI, risk, flip, time-to-sell
- Goblin verdict + Brain Mode (5 lenses)
- Screenshot Intake + OCR + listing parser
- Manual Comparable Sales v1 (Analyze temp / Detail persisted)
- **Haggle Mode v1**
  - Panel on **Analyze** (standard preview) and **Deal Detail**
  - Buy targets: break-even, max for 25/50/100% ROI, fees/repairs buffer
  - Negotiation: opening offer, counter range, walk-away price
  - Asking rating: Great / Good / Tight / Overpriced
  - Copy-paste scripts (opening, counter, walk-away)
- **`getDealViewModel()` / `getPreviewViewModel()`** — single derived-data path (includes `haggle`)

## Architecture summary

```
SavedDeal → getDealViewModel() → UI (card, detail, haggle, dashboard)
Analyze   → getPreviewViewModel() → same pipeline (haggle hidden in Brain Mode)
```

Resale priority: **manual** → **comps** (3+ enabled) → **estimated**.

Haggle uses `resolved.effectiveResaleValue` + `analysis.roiPercent` from the view model — never cached blobs.

## Data model summary

**`SavedDeal`** = inputs + `comps`, `useCompsForResale`, cached `analysis`/`verdict` (write-only for schema).

**`DealViewModel`** = `input`, `comps`, `compSummary`, `resolved`, `analysis`, `verdict`, `display`, **`haggle`**.

**`HaggleGuide`** = price targets, rating, scripts (runtime only, not persisted).

## localStorage schema

| Key | Value |
|-----|-------|
| `marketplace-goblin-deals` | `SavedDeal[]` JSON |

Unchanged — haggle is computed on read, not stored.

## Analysis + haggle pipeline

1. View model builds `analysis` from inputs/comps
2. `calculateHaggleGuide(input, analysis, effectiveResaleValue)`
3. Net resale = resale − fees/repairs buffer (category + condition)
4. Max buy@ROI = net / (1 + ROI/100)
5. Rate ask vs 100/50/25% ceilings → Great/Good/Tight/Overpriced

## Known risks / technical debt

- Haggle hidden during Brain Mode on Analyze (uses alternate analysis).
- Fees/buffer rates are heuristic, not user-editable.
- View model recomputed per render — memoize at scale.

## Recent changes

- `haggle-calculations.ts` + tests
- `HaggleModePanel` with copy buttons
- `DealViewModel.haggle` wired through preview + detail

## Verification

```bash
npm run test    # 33 passed
npm run build
npm run lint
```

Manual: analyze a listing → Haggle Mode shows rating + targets; copy opening script; change asking price → rating updates; Detail matches Analyze after save.

## Recommended next step

Let users tweak fees/buffer % in Haggle Mode, or show haggle summary on **DealCard**.
