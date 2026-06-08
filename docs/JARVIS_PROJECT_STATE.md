# Marketplace Goblin — Project State

Last updated: 2026-06-08 (Category Intelligence v1)

## Product intent

Client-only flip assistant: appraise deals, build comps fast, negotiate, optional URL autofill. No backend, scraping services, or paid APIs.

## Implemented features

- Deal form, analysis, verdict, Brain Mode, Haggle Mode
- Screenshot/OCR intake, Listing URL autofill (CORS-only)
- Manual Comparable Sales + comp-driven resale estimate
- Smart Comp Builder v1 (paste comp text, batch parse, preview/import)
- **Category Intelligence v1**
  - Eight intelligence buckets: Electronics, Tools & Hardware, Vehicles, Furniture, Appliances, Collectibles, Clothing, Other
  - Maps 12 `DealCategory` values into buckets (e.g. Home & Garden → Other)
  - Keyword signals from item name, notes, and comp titles/notes
  - Per category: hidden risks, value boosters, penalties, inspection checklist, resale speed notes, negotiation leverage
  - Integrates with risk score, estimate confidence, verdict reasoning, display warnings/advice, Haggle Mode notes
  - `CategoryIntelligencePanel` on Analyze preview and Deal Detail
- `getDealViewModel()` for derived UI

## Architecture summary

```
DealInput + comps → buildCategoryIntelligence(haystack)
  → signals + risk/confidence adjustments
  → resolveDeal / analyzeDeal / getGoblinVerdict / calculateHaggleGuide
  → getDealViewModel.display.warnings + categoryIntel panel
```

## Data model summary

**`CategoryIntelligence`** is derived at view-model time (not persisted). Cached `SavedDeal.analysis` / `verdict` refresh on save/load with category intel applied.

## localStorage schema

Unchanged: `SavedDeal` fields; category intel recomputed from stored inputs + comps.

## Key modules

| Module | Role |
|--------|------|
| `category-intelligence.ts` | Profiles, signal detection, risk/confidence deltas |
| `types/category-intelligence.ts` | `CategoryIntelligence`, signal types |
| `category-intelligence-panel.tsx` | Mobile-first UI for signals, checklist, advice |
| `deal-view-model.ts` | Wires intel into warnings, haggle, verdict path |
| `comp-text-parser.ts` | Batch comp paste (unchanged) |

## Known risks / technical debt

- Signal detection is deterministic keyword/regex — not semantic.
- OCR/listing text only affects intel when captured in `notes` or comp fields.
- Brain Mode uses same category intel as standard analysis; panel hidden during brain lens view.

## Recent changes

- Category Intelligence v1 + 12 detection tests (65 total)
- Risk score +0–3 from matched risks/penalties; confidence downgrade on severe flags
- Haggle Mode shows category negotiation leverage notes

## Verification

```bash
npm run test && npm run build && npm run lint
```

Manual: Analyze an iPhone with notes `iCloud locked, cracked screen` → see Electronics risks, checklist, verdict lines, haggle leverage. Try Tools item with `Milwaukee Fuel, rust, no battery`.

## Recommended next step

Persist optional `listingText` on deals for richer intel without stuffing notes, or category-specific comp paste hints.
