# Marketplace Goblin — Project State

Last updated: 2026-06-08 (Item Identity v1)

## Product intent

Client-only flip assistant: appraise deals, build comps fast, negotiate, optional URL autofill. No backend, scraping services, or paid APIs.

## Implemented features

- Deal form, analysis, verdict, Brain Mode, Haggle Mode
- Screenshot/OCR intake, Listing URL autofill (CORS-only)
- Manual Comparable Sales + comp-driven resale estimate
- Smart Comp Builder, Comp Estimate Accelerator v1
- Category Intelligence v1
- **Item Identity v1**
  - Structured identity: brand, model, product family, variant, confidence
  - Detection from item name, notes, listing/OCR text, comp titles, URL path hints
  - Supported categories: Electronics, Tools & Hardware, Appliances, Vehicles & Parts, Furniture, Collectibles, Clothing
  - Brands, model numbers, product families, grading (PSA/CGC/BGS), tool lines (M18, XR, Fuel, FlexVolt), trim/storage variants
  - `getItemIdentity()` feeds resale confidence, risk score, category intel, haggle notes, verdict reasoning
  - `ItemIdentityPanel` on Analyze + Deal Detail
  - Listing parser and comp text parser attach `identity` / `detectedIdentity`
- `getDealViewModel()` for derived UI

## Architecture summary

```
DealInput + comps + optional listing/OCR text
  → getItemIdentity() → ItemIdentity
  → buildCategoryIntelligence(..., itemIdentity)
  → analyzeDeal / resolveDeal / getGoblinVerdict / haggle
```

## Data model summary

**`ItemIdentity`** is derived at view-model time (not persisted on `SavedDeal`).

## localStorage schema

Unchanged for saved deals. Analyze draft unchanged.

## Key modules

| Module | Role |
|--------|------|
| `item-identity.ts` | Brand/model/family/variant detection, confidence scoring |
| `types/item-identity.ts` | `ItemIdentity`, `IdentityConfidence` |
| `item-identity-panel.tsx` | Brand, model, confidence badge UI |
| `listing-parser.ts` | `ParsedListingResult.identity` |
| `comp-text-parser.ts` | `ParsedCompDraft.detectedIdentity` |

## Known risks / technical debt

- Identity detection is keyword/regex — homonyms and typos may mislabel.
- OCR/listing text only helps when passed via notes, parser, or `ItemIdentitySources`.
- Unsupported categories (Books, Toys, etc.) return empty identity.

## Recent changes

- Item Identity v1 + 12 detection tests (91 total)
- Estimate confidence upgrade and risk reduction when identity is strong

## Verification

```bash
npm run test && npm run build && npm run lint
```

Manual: Analyze `Milwaukee M18 Fuel drill` or `iPhone 13 Pro 128GB` → Item Identity panel shows brand/model + confidence.

## Recommended next step

Cross-check detected identity against imported comp titles, or suggest sold-search queries from identity fields.
