# Marketplace Goblin — Project State

Last updated: 2026-06-08 (Identity Reliability Pass v1)

## Product intent

Client-only flip assistant: appraise deals, build comps fast, negotiate, optional URL autofill. No backend, scraping services, or paid APIs.

## Implemented features

- Deal form, analysis, verdict, Brain Mode, Haggle Mode
- Screenshot/OCR intake, Listing URL autofill (CORS-only)
- Manual Comparable Sales + comp-driven resale estimate
- Smart Comp Builder, Comp Estimate Accelerator v1
- Category Intelligence v1
- Item Identity v1 + **Identity Reliability Pass v1**
  - Per-source identity detection: Item Name, Notes, OCR (cleaned), Listing Text, Comparable Sales, URL
  - Evidence metadata: matched sources, match count, conflict count
  - Conflict detection across sources — conflicting brands/models clear consensus and downgrade confidence
  - Calibrated confidence: multiple primary signals increase trust; weak-only or URL-only signals stay low; unknown preferred over incorrect
  - Warnings surfaced in UI and view model (`"Conflicting identity signals detected"`, limited-evidence notice)
  - OCR text wired into analyze preview via draft persistence + `ScreenshotIntake` callback
  - `DealViewModel.identity` summary: confidence, evidence count, conflict state, warnings
  - `ItemIdentityPanel` shows confidence badge, evidence sources, conflict warnings
  - Estimate confidence upgrade and risk adjustment respect conflict state
- `getDealViewModel()` / `getPreviewViewModel()` for derived UI

## Architecture summary

```
DealInput + comps + identitySources (OCR, listing text, URL)
  → per-source detect → merge + conflict check → ItemIdentity
  → buildCategoryIntelligence(..., itemIdentity)
  → analyzeDeal / resolveDeal / getGoblinVerdict / haggle
```

## Data model summary

**`ItemIdentity`** is derived at view-model time (not persisted on `SavedDeal`). Analyze draft may persist `identitySources` (OCR/listing text) for preview continuity.

## localStorage schema

**Analyze draft** (`marketplace-goblin-analyze-draft`): optional `identitySources: { ocrText?, listingText? }`.

Saved deals schema unchanged.

## Key modules

| Module | Role |
|--------|------|
| `item-identity.ts` | Per-source detection, conflict resolution, confidence calibration |
| `types/item-identity.ts` | `ItemIdentity`, `IdentityEvidence`, `ItemIdentitySources` |
| `item-identity-panel.tsx` | Confidence, evidence sources, conflict warnings |
| `deal-view-model.ts` | `identity` summary slice + warning merge |
| `analyze-draft.ts` | Persists OCR/listing text for analyze session |

## Known risks / technical debt

- Identity detection remains keyword/regex — homonyms and typos may still mislabel within a single source.
- Saved deals do not persist OCR/listing text; identity on Deal Detail uses item name, notes, comps, URL only.
- Unsupported categories (Books, Toys, etc.) return empty identity.

## Recent changes

- Identity Reliability Pass v1: per-source evidence, conflict detection, OCR integration, calibrated confidence (93 tests)
- Item Identity v1 baseline (brand/model/family/variant detection)

## Verification

```bash
npm run test && npm run build && npm run lint
```

Manual:
1. Analyze `Milwaukee M18 Fuel drill` → high/medium confidence, evidence from Item Name.
2. OCR a Samsung listing with generic item name → OCR + Listing Text appear in evidence sources.
3. Item name `Samsung Galaxy` + notes `Apple iPhone` → conflict warning, brand cleared, low confidence.

## Recommended next step

Suggest sold-search queries from locked identity fields, or flag when comp titles disagree with detected identity.
