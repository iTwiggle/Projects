# Marketplace Goblin — Project State

Last updated: 2026-06-08 (Comp Estimate Accelerator v1)

## Product intent

Client-only flip assistant: appraise deals, build comps fast, negotiate, optional URL autofill. No backend, scraping services, or paid APIs.

## Implemented features

- Deal form, analysis, verdict, Brain Mode, Haggle Mode
- Screenshot/OCR intake, Listing URL autofill (CORS-only)
- Manual Comparable Sales + comp-driven resale estimate
- Smart Comp Builder v1 (paste comp text, batch parse, preview/import)
- Category Intelligence v1 (category-aware risks, checklist, haggle notes)
- **Comp Estimate Accelerator v1**
  - Estimate progress tiers: Rough → Market Informed → Strong → High Confidence
  - Progress UI on Analyze + Deal Detail
  - Auto-enable comps estimate at 3+ comps (unless user manually turns off)
  - Quick comp entry (title, price, sold/listed; smart defaults)
  - Bulk actions: mark all sold/listed, set platform for all
  - Session memory for last comp platform
  - localStorage draft for unsaved analyze comp work
  - “Need X more comps” guidance
- `getDealViewModel()` for derived UI

## Architecture summary

```
Comps → getCompProgress() → CompProgressIndicator
  → resolveUseCompsForResale() auto-toggle
  → existing comp-calculations / resale-estimate (unchanged rules)
Analyze draft → localStorage (comps + estimate toggle state)
Comp platform → sessionStorage (last used)
```

## Data model summary

**`AnalyzeDraft`** in localStorage (`marketplace-goblin-analyze-draft`) for unsaved preview comps. Saved deals unchanged.

## localStorage schema

- `marketplace-goblin-deals` — saved deals (unchanged)
- `marketplace-goblin-analyze-draft` — ephemeral analyze session (input, comps, toggle, manual-off flag)

## Key modules

| Module | Role |
|--------|------|
| `comp-progress.ts` | Progress tiers, guidance, auto-enable resolver |
| `comp-quick-entry.ts` | Minimal comp builder with defaults |
| `comp-progress-indicator.tsx` | Progress step UI |
| `comp-session.ts` | Last comp platform (session) |
| `analyze-draft.ts` | Unsaved analyze comp persistence |
| `comparable-sales-panel.tsx` | Quick comp, bulk actions, progress |

## Known risks / technical debt

- Progress “High Confidence” tier (5+ sold) is UI guidance; comp-calculations confidence rules unchanged.
- Analyze draft is single-slot (one unsaved session at a time).
- Re-analyze keeps comps (no longer cleared) — user may need Reset for a fresh comp set.

## Recent changes

- Comp Estimate Accelerator v1 + 14 new tests (79 total)
- Comps no longer cleared on re-analyze; draft restores on refresh

## Verification

```bash
npm run test && npm run build && npm run lint
```

Manual: Quick-add 3 comps → auto-enable estimate → progress shows Strong → add 2 more sold → High Confidence.

## Recommended next step

Sold-search deep links from item name, or export/share comps as text.
