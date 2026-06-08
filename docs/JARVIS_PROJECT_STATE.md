# Marketplace Goblin — Project State

Last updated: 2026-06-08 (Extension Spec draft)

## Product intent

Client-only flip assistant: appraise deals, build comps fast, negotiate, optional URL autofill. No backend, scraping services, or paid APIs.

## Implemented features

- Deal form, analysis, verdict, Brain Mode, Haggle Mode
- Screenshot/OCR intake, Listing URL autofill (CORS-only)
- Manual Comparable Sales + comp-driven resale estimate
- Smart Comp Builder, Comp Estimate Accelerator v1
- Category Intelligence v1
- Item Identity v1 + Identity Reliability Pass v1
- **Identity-Aware Comp Search Links v1**
  - One-tap comp search links in Comparable Sales panel (Analyze + Deal Detail)
  - Query from detected identity when confidence is medium/high and uncontested
  - Item-name fallback when confidence is low or conflicts exist
  - Platforms: eBay sold/active, Facebook Marketplace, Craigslist, Google Shopping, Google Search
  - Copy search query; badge shows Identity-based vs Item-name fallback
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
| `comp-search-links.ts` | Identity-aware query + marketplace URL builders |
| `comp-search-links-panel.tsx` | One-tap search links + copy query UI |
| `analyze-draft.ts` | Persists OCR/listing text for analyze session |
| `types/comp-capture.ts` | `CapturedComp`, `CompCaptureBatch`, `CompImportReport` |
| `comp-capture-import.ts` | Normalize captured comps → `ComparableSale[]` |

## Known risks / technical debt

- Identity detection remains keyword/regex — homonyms and typos may still mislabel within a single source.
- Saved deals do not persist OCR/listing text; identity on Deal Detail uses item name, notes, comps, URL only.
- Unsupported categories (Books, Toys, etc.) return empty identity.

## Recent changes

- Comp Capture Import Phase 1: JSON envelope import, normalization, dedupe, mismatch warnings (117 tests)
- Identity-Aware Comp Search Links v1: 6 marketplace links from identity or item name
- Identity Reliability Pass v1: per-source evidence, conflict detection, OCR integration, calibrated confidence
- Item Identity v1 baseline (brand/model/family/variant detection)

## Verification

```bash
npm run test && npm run build && npm run lint
```

Manual:
1. Analyze `Milwaukee M18 Fuel drill` → Comp search links use identity-based query with Milwaukee.
2. Analyze vague item name with low identity → links use item-name fallback badge.
3. Tap eBay sold / Facebook / Copy query in Comparable Sales panel.

## v2 planning

**Data acquisition spec (draft):** [`docs/MARKETPLACE_GOBLIN_V2_DATA_ACQUISITION_SPEC.md`](./MARKETPLACE_GOBLIN_V2_DATA_ACQUISITION_SPEC.md)

Planned hybrid path: identity-aware search links (shipped) → browser extension capture → paste/JSON import fallback → optional SerpApi eBay sold via thin BFF (paid tier).

**Phase 1 shipped:** `CompCaptureBatch` types, `normalizeCapturedComps()`, JSON paste/file import in Comparable Sales panel, identity/search-query mismatch warnings, plain-text paste preserved.

**Extension spec (draft):** [`docs/MARKETPLACE_GOBLIN_EXTENSION_SPEC.md`](./MARKETPLACE_GOBLIN_EXTENSION_SPEC.md) — user-initiated capture, per-site strategy, MVP build order (eBay first).

## Recommended next step

Implement extension scaffold + eBay sold search capture per extension spec Step 1–2.
