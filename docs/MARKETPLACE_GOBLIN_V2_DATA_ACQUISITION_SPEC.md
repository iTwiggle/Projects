# Marketplace Goblin v2 — Data Acquisition Spec

**Status:** Draft (planning only — no implementation committed)  
**Last updated:** 2026-06-08  
**Owner:** Marketplace Goblin / solo-dev track

## Purpose

Define how Marketplace Goblin v2 reduces manual comparable-sales gathering while staying realistic for a client-first product built by a solo developer. This document is the planning source of truth for comp data acquisition. It does **not** authorize implementation by itself.

## Problem statement

v1 still requires the user to:

1. Open marketplace searches (partially helped by identity-aware comp search links)
2. Read results manually
3. Type, quick-enter, or paste comps into the app

v2 should shorten that loop to **search → capture → import → analyze**, without turning the project into a scraping infrastructure company.

---

## 1. V2 Strategy

### Guiding principles

- **User-initiated capture over unattended scraping** — the user is on the page; the tool assists extraction.
- **Client-first by default** — no mandatory backend for core workflows.
- **Platform-appropriate automation** — eBay sold may justify paid API aggregation later; Facebook/OfferUp should rely on extension capture.
- **Reuse existing pipelines** — captured data must map cleanly to `ComparableSale` and the comp estimate engine.
- **Identity as orchestration** — comp search links are the start of the workflow, not the end.

### Hybrid path (recommended)

| Layer | What | When | Role |
|-------|------|------|------|
| **Now (v1)** | Identity-aware search links | Shipped | Launch pad: open correct marketplace search with identity-based or item-name query |
| **Next** | Browser extension capture | v2 Phase 2 | One-click import of visible search results from supported sites |
| **Always** | Paste / HTML import fallback | v2 Phase 1 + ongoing | Works without extension; power-user and mobile fallback |
| **Later** | SerpApi-backed eBay sold via thin BFF | v2 Phase 4 (paid tier) | One-tap eBay sold comps; API key hidden server-side |

### What v2 is not

- Not a multi-platform backend scraper farm
- Not credential harvesting or logged-in session replay on a server
- Not a replacement for user judgment on condition, bundles, or local pricing
- Not a mobile-native full automation story (extensions are desktop-first)

### Success criteria

- Import **3+ comps in under 60 seconds** on desktop for a typical eBay sold search
- **Zero hosting cost** for Phases 1–3
- Captured comps pass validation and feed existing `MIN_COMPS_FOR_ESTIMATE` logic without schema changes to saved deals

---

## 2. Browser Extension Concept

### Supported sites (v2 target)

| Site | Priority | Rationale |
|------|----------|-----------|
| **eBay** | P0 | Sold search is structured; highest comp signal for many categories |
| **Facebook Marketplace** | P0 | Primary local flip source; no public API |
| **Craigslist** | P1 | Simple HTML; common local comp source |
| **OfferUp** | P1 | Local marketplace; SPA but extension runs in user session |

Mercari, Poshmark, Grailed remain **out of scope** for extension v1 unless parsers already exist in paste-comp.

### User flow

```
Analyze deal in Marketplace Goblin
  → Comp search links (identity-based or item-name fallback)
  → User taps "eBay sold" / "Facebook Marketplace" / etc.
  → Browser opens pre-filled search (existing v1 behavior)
  → Extension badge shows "Goblin: N listings detected"
  → User reviews results on page (scroll/load more if desired)
  → User clicks "Capture visible comps" or selects rows
  → Extension previews parsed comps (title, price, sold/listed)
  → User confirms "Send to Goblin"
  → Goblin imports comps into active Analyze draft or prompts to open app
```

Optional later: extension reads a **deal context token** from Goblin (search query + deal id in URL hash or clipboard) so imports attach to the right analyze session.

### Captured fields (per listing)

Minimum viable capture from DOM:

| Field | Required | Notes |
|-------|----------|-------|
| `title` | Yes | Listing title as shown |
| `price` | Yes | Numeric; sold price preferred on eBay sold view |
| `platform` | Yes | Normalized label matching `COMP_PLATFORMS` where possible |
| `listingType` | Yes | `sold` or `listed` |
| `url` | Recommended | Canonical listing URL when available |
| `condition` | No | Default `Good` in app if missing |
| `imageUrl` | No | Thumbnail only; do not hotlink at scale in v1 |
| `capturedAt` | Yes | ISO 8601 timestamp |
| `rawText` | Recommended | Concatenated visible text for re-parse / debug |
| `confidence` | Yes | Per-field or aggregate capture confidence |

Extension must **not** capture: seller phone, email, messenger threads, exact address, or other PII beyond what is already on the public listing card.

### Permissions needed (Manifest V3 sketch)

| Permission | Why |
|------------|-----|
| `activeTab` | Read DOM on user-clicked tab only (preferred over broad `<all_urls>`) |
| Host permissions: `*://*.ebay.com/*`, `*://*.facebook.com/*`, `*://*.craigslist.org/*`, `*://offerup.com/*` | Content scripts on marketplace search pages |
| `storage` (optional) | Remember last import count, user prefs |
| `clipboardWrite` (optional) | JSON export fallback |

Avoid: `cookies`, `webRequest` blocking, background fetch of authenticated APIs, `<all_urls>`.

### Limitations

- **DOM fragility** — site redesigns break parsers; expect quarterly maintenance per platform.
- **Desktop-first** — mobile browsers do not support extensions uniformly.
- **Partial page capture** — only visible or selected rows; infinite scroll may need "capture again" merges.
- **Sold vs listed ambiguity** — Facebook/Craigslist/OfferUp often show asking prices only; user may need to mark listing type.
- **Geo/local results** — extension captures what the user sees; no normalization across regions.
- **No offline marketplace access** — user must be logged in where the site requires it (Facebook, OfferUp).
- **Chrome Web Store review** — description must emphasize user-initiated data export, not bulk scraping.

### Privacy expectations (user-facing)

- Extension runs **only when the user triggers capture** on an open tab.
- Captured data is sent to Marketplace Goblin **locally** (postMessage / paste / JSON file) — not to a third-party analytics server in v2.
- No Facebook/OfferUp/eBay **credentials** are read or stored.
- No background polling of marketplace pages.
- Raw listing text may be stored in comp `notes` only if user opts in; default notes empty.

---

## 3. Comp Capture Schema

Captured comps use a versioned envelope so paste, extension, and future BFF responses share one contract.

### Envelope: `CompCaptureBatch`

```json
{
  "schemaVersion": "1.0",
  "source": "extension" | "paste" | "html" | "serpapi" | "manual",
  "platform": "eBay" | "Facebook Marketplace" | "Craigslist" | "OfferUp" | "Other",
  "searchQuery": "Milwaukee M18 Fuel drill",
  "capturedAt": "2026-06-08T19:00:00.000Z",
  "pageUrl": "https://www.ebay.com/sch/i.html?...",
  "comps": [ /* CapturedComp[] */ ]
}
```

### Item: `CapturedComp`

```json
{
  "title": "Milwaukee M18 Fuel Hammer Drill",
  "price": 89.99,
  "platform": "eBay",
  "listingType": "sold",
  "condition": "Good",
  "url": "https://www.ebay.com/itm/...",
  "imageUrl": "https://...",
  "capturedAt": "2026-06-08T19:00:00.000Z",
  "rawText": "Milwaukee M18 Fuel Hammer Drill\n$89.99\nSold",
  "confidence": {
    "title": "high",
    "price": "high",
    "listingType": "high",
    "platform": "high",
    "condition": "low"
  }
}
```

### Field rules

| Field | Type | Rules |
|-------|------|-------|
| `title` | string | 1–200 chars after trim; required |
| `price` | number | `> 0`, max 1_000_000; required |
| `platform` | string | Prefer `COMP_PLATFORMS` values; unknown → `"Other"` |
| `listingType` | `"sold"` \| `"listed"` | Required; default `listed` if ambiguous with low confidence |
| `condition` | string | Optional; must map to `DealCondition` enum or default `Good` |
| `url` | string | Optional; must be `http:` or `https:` if present |
| `imageUrl` | string | Optional; not persisted on `ComparableSale` in v1 |
| `capturedAt` | string | ISO 8601 |
| `rawText` | string | Optional; max 2_000 chars recommended |
| `confidence` | object | Values: `"low"` \| `"medium"` \| `"high"` per field (aligns with `FieldConfidence`) |

### Mapping to `ComparableSale` (app internal)

```text
CapturedComp + generateCompId()
  → ComparableSale {
       id,
       title,
       platform,
       price,
       condition: mapped or "Good",
       notes: optional excerpt from rawText or url,
       listingType
     }
```

`imageUrl` is **not** stored on `ComparableSale` in v2.0; may be used only in import preview UI.

---

## 4. App Import Contract

The web app accepts comp batches through three channels with one normalization pipeline.

### 4.1 Paste import (existing path, extended)

**Input:** Plain text blocks (current `paste-comp-text`) or pasted JSON.

**Behavior:**

- If input parses as JSON and matches `CompCaptureBatch` schema → normalize via capture pipeline.
- Else → existing `parseCompTextBatch()` path.

**UI label:** "Paste comps or JSON"

### 4.2 JSON import (new, Phase 1)

**Input:** `CompCaptureBatch` JSON (file drop or textarea).

**Validation:**

1. `schemaVersion` supported (reject unknown with friendly error)
2. `comps.length` between 1 and 50 per batch
3. Each comp passes field rules in §3
4. Deduplicate by `(platform, title, price)` within batch
5. Drop comps with `price <= 0` or empty `title`; report dropped count

**Output:** `ComparableSale[]` ready for `onCompsChange` / append to draft.

### 4.3 Extension bridge (future, Phase 2+)

**Preferred:** `window.postMessage` from content script → Goblin tab with origin check.

```text
Message type: MARKETPLACE_GOBLIN_COMP_IMPORT
Payload: CompCaptureBatch
Origin: extension id or https://<goblin-host>
```

**Fallbacks:**

- Copy JSON to clipboard → user pastes in Goblin
- Custom URL scheme / deep link: `marketplace-goblin://import?payload=<base64>` (optional, store policy permitting)
- Local extension storage + "Open Goblin" button that passes batch id

**Security:**

- Validate `schemaVersion` and payload size (max ~100 KB)
- Ignore messages from unknown origins
- Never `eval` imported JSON

### 4.4 Validation summary

| Check | Action |
|-------|--------|
| Missing title or price | Reject comp, log in import report |
| Unknown platform | Map to `Other` or infer from `batch.platform` |
| Invalid `listingType` | Default `listed`, confidence `low` |
| Duplicate of existing comp in session | Skip or merge (user setting; default skip) |
| Identity mismatch (optional) | Warn if comp title disagrees with `itemIdentity` query; do not block import |

### Import report (UX)

After import, show:

- N comps added, M skipped
- Source: extension / paste / JSON / SerpApi
- Listing type breakdown (sold vs listed)
- Optional identity mismatch warnings

---

## 5. SerpApi / Thin Backend Future

### When to add

Add only when **all** are true:

1. Phase 1 import contract is stable and used by extension/paste
2. Users repeatedly ask for one-click eBay sold comps without extension install
3. Recurring revenue or usage budget covers API cost (~$50–75/mo entry + per-search)
4. API keys can live server-side (never in client bundle)

Do **not** add backend scraping for Facebook/OfferUp in v2.

### Likely endpoints (illustrative)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/comps/ebay-sold` | POST | Body: `{ query, limit?, priceMin?, priceMax? }` → `CompCaptureBatch` |
| `GET /api/comps/health` | GET | Rate-limit status, feature flag |

Implementation options: Next.js Route Handler, Cloudflare Worker, or minimal VPS — **thin BFF only**, no database required initially.

### Response shape

BFF returns **`CompCaptureBatch`** (§3) with:

```json
{
  "schemaVersion": "1.0",
  "source": "serpapi",
  "platform": "eBay",
  "searchQuery": "Milwaukee M18 Fuel",
  "capturedAt": "...",
  "comps": [ /* mapped from SerpApi eBay organic results, show_only=Sold */ ]
}
```

Map SerpApi fields: title, price.extracted, link, thumbnail (preview only), sold date → `notes` or `rawText`.

### Cost and rate limits

- SerpApi: per-search billing; sold filter + pagination = multiple searches per user action
- Cache responses **24h** by `(query, filters)` server-side to reduce cost (optional)
- Per-user rate limit: e.g. 20 searches/day free trial, unlimited on paid tier
- Monitor error rate; SerpApi breakage is vendor-managed but still a product risk

### Paid-tier only rationale

- Direct marginal cost per search
- Legal/ToS posture is grayer than user-initiated capture
- API key is a secrets-management obligation
- Prevents abuse/open proxy if endpoint is public

Free tier keeps: search links, extension, paste/HTML import.

---

## 6. Legal / TOS Risk Notes

> Not legal advice. Consult counsel before commercial launch of extension or BFF.

| Practice | Risk | v2 stance |
|----------|------|-----------|
| Unattended server scraping | High — CFAA/contract claims, IP bans | **Avoid** for FB/OfferUp; defer eBay to SerpApi vendor |
| User-initiated DOM capture in extension | Medium — may still breach platform ToS | **Preferred**; user browses and explicitly exports |
| Reading user credentials / cookies | High | **Never** |
| Bypassing login walls or CAPTCHAs | High | **Never** |
| Scraping messenger / seller contact info | High (privacy) | **Never** |
| Storing PII in comps | Medium (GDPR/CCPA) | **Minimize**; no seller names/phones in schema |
| Craigslist historical enforcement | Medium | Extension + paste only; no Craigslist-specific backend scraper |
| SerpApi resale of data | Medium | Paid tier; disclose third-party; follow SerpApi terms |

**Practical posture:** Market the extension as a **personal productivity tool** that helps the user record listings they already view — not a data broker or monitoring service.

---

## 7. Recommended Build Order

### Phase 1 — App-side import contract (no extension)

**Goal:** One normalization path for all future sources.

- [ ] Define TypeScript types mirroring §3 (`CompCaptureBatch`, `CapturedComp`) — when implementing
- [ ] `normalizeCapturedComps(batch) → ComparableSale[]`
- [ ] JSON import UI in Comparable Sales panel (file + paste)
- [ ] Extend paste-comp to detect JSON envelope
- [ ] Import report + dedupe + validation errors
- [ ] Optional: identity mismatch warnings vs `compSearch.query`

**Exit:** Sample JSON fixture imports 5 comps into analyze draft.

### Phase 2 — Extension prototype (current page capture)

**Goal:** Prove capture on one site end-to-end.

- [ ] MV3 extension shell + activeTab permission
- [ ] eBay sold search parser (P0)
- [ ] Export `CompCaptureBatch` to clipboard JSON
- [ ] Goblin Phase 1 JSON import consumes it
- [ ] Add Facebook Marketplace parser (P0)
- [ ] Craigslist + OfferUp (P1)

**Exit:** User completes eBay sold search → capture → paste/import in &lt; 60s.

### Phase 3 — eBay sold helper (extension polish)

**Goal:** Reduce friction without backend.

- [ ] postMessage bridge Goblin ↔ extension
- [ ] Deal context: pass search query from comp search links
- [ ] Row selection mode vs "all visible"
- [ ] Chrome Web Store listing + privacy policy

**Exit:** No clipboard step required on desktop.

### Phase 4 — Optional backend / BFF (paid tier)

**Goal:** One-tap eBay sold for non-extension users.

- [ ] SerpApi integration behind `POST /api/comps/ebay-sold`
- [ ] Auth + rate limits + caching
- [ ] Billing gate
- [ ] Return `CompCaptureBatch`; reuse Phase 1 normalizer

**Exit:** Paid user imports 10 eBay sold comps from in-app button.

---

## 8. Open Questions

Decide before implementation:

| # | Question | Options / notes |
|---|----------|-----------------|
| 1 | **Extension ↔ app linking** | postMessage only vs clipboard vs both |
| 2 | **Deal context handoff** | URL query param, localStorage key, or extension storage |
| 3 | **Deduping across imports** | Skip duplicate (title+price) vs allow with warning |
| 4 | **Default listing type** | When unknown: `listed` (safer for estimate) vs `sold` |
| 5 | **Condition inference** | Capture from DOM vs always default `Good` |
| 6 | **Identity mismatch** | Warn only vs soft-block import |
| 7 | **imageUrl** | Preview-only vs never show |
| 8 | **Hosted Goblin URL** | Required for postMessage origin allowlist |
| 9 | **Firefox support** | Phase 2 or Chrome-only MVP |
| 10 | **SerpApi vendor** | SerpApi vs Apify eBay actor vs delay Phase 4 |
| 11 | **Paid tier pricing** | Must cover ~$0.01–0.05 per eBay search + margin |
| 12 | **Comp batch size cap** | 50 per import enough? |
| 13 | **Notes field** | Auto-fill URL in notes vs leave empty |
| 14 | **Mobile story** | Paste-only vs Share Sheet later |

---

## Related documents

- `docs/JARVIS_PROJECT_STATE.md` — current shipped features and module map
- `src/lib/types/comps.ts` — `ComparableSale`, `COMP_PLATFORMS`
- `src/lib/intake/comp-text-parser.ts` — paste comp parsing (v1)
- `src/lib/analysis/comp-search-links.ts` — identity-aware search URLs (v1)

## Revision history

| Date | Change |
|------|--------|
| 2026-06-08 | Initial draft — hybrid v2 data acquisition spec |
