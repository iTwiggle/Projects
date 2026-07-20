# Marketplace Goblin — Browser Extension Spec (Prototype)

**Status:** Draft (planning only — no implementation committed)  
**Last updated:** 2026-06-08  
**Owner:** Marketplace Goblin / solo-dev track  
**Depends on:** [Comp Capture Import Phase 1](./MARKETPLACE_GOBLIN_V2_DATA_ACQUISITION_SPEC.md) (`CompCaptureBatch` contract shipped in app)

## Purpose

Define the browser extension prototype before writing any extension code. The extension assists **user-initiated** capture of visible listing/comp data from marketplace pages and exports a `CompCaptureBatch` JSON envelope that Marketplace Goblin already imports via Phase 1.

This document does **not** authorize implementation by itself.

---

## 1. Extension Goal

Help flippers move from **search → manual typing** to **search → capture → import** with minimal friction.

The extension:

- Runs only when the user opens it on a supported marketplace page
- Reads **visible DOM content** the user is already viewing (listing detail or search results)
- Extracts structured comp candidates (title, price, platform, sold/listed, URL)
- Lets the user **review and edit** before export
- Outputs **`CompCaptureBatch` JSON** (`source: "extension"`) for import into Goblin

The extension is **not**:

- A background scraper or price monitor
- A credential/session harvester
- A server that uploads listing data
- A replacement for user judgment on condition, bundles, or local pricing

### Success criteria (prototype)

- User captures **3+ eBay sold comps** from a search results page in under 60 seconds (including review + clipboard paste into Goblin)
- Exported JSON passes `normalizeCapturedComps()` without schema changes
- Zero extension network calls to non-marketplace origins in MVP

---

## 2. Supported Sites v1

| Site | MVP priority | Primary use case |
|------|--------------|------------------|
| **eBay** | P0 — first implementation | Sold search results + single listing pages |
| **Craigslist** | P1 — second | Search results + post detail (simple HTML) |
| **Facebook Marketplace** | P2 — later | Search grid + listing detail (logged-in SPA) |
| **OfferUp** | P2 — later | Search grid + listing detail (SPA, anti-bot) |

**Out of scope for extension v1:** Mercari, Poshmark, Grailed, Google Shopping (use comp search links only).

### Host permission targets (Manifest V3)

```
*://*.ebay.com/*
*://*.craigslist.org/*
*://www.facebook.com/*
*://m.facebook.com/*
*://offerup.com/*
*://www.offerup.com/*
```

Use **narrow host permissions** per site — not `<all_urls>`.

---

## 3. User Flow

### End-to-end (MVP: clipboard bridge)

```
1. User analyzes a deal in Marketplace Goblin
2. User taps identity-aware comp search link (e.g. "eBay sold")
3. Browser opens marketplace search with pre-filled query
4. User scrolls/filters results as they normally would
5. User clicks Marketplace Goblin extension icon
6. Extension popup shows:
   - Detected site + page type (search vs listing)
   - Capture mode options
   - "Capture visible listings" action
7. Extension injects content script → extracts visible cards/rows
8. Popup shows preview table (title, price, sold/listed, URL)
9. User edits/removes rows if needed
10. User clicks "Copy JSON to clipboard"
11. User returns to Goblin → Paste Comp Text / JSON → Preview → Import
12. Goblin runs normalizeCapturedComps() → comps appear in panel
```

### Future flow (post-MVP)

```
Steps 1–9 same
10. User clicks "Send to Goblin"
11. Extension postMessages open Goblin tab OR deep-links with batch payload
12. Goblin auto-imports without clipboard step
```

### Optional deal context (future)

Goblin may pass context when opening search links:

- `searchQuery` (already known from comp search links)
- `dealSessionId` (analyze draft id or ephemeral token)

Extension embeds these in `CompCaptureBatch.searchQuery` and optional metadata for import warnings (already supported in Phase 1).

---

## 4. Capture Modes

### Mode A — Single listing capture

**When:** User is on one listing/detail page.

**Extracts:** One `CapturedComp` from the main listing block.

**Use cases:**

- eBay item page (`/itm/`)
- Craigslist post detail
- Facebook Marketplace item
- OfferUp item detail

### Mode B — Search results / listing cards capture

**When:** User is on search or category results.

**Extracts:** All **currently visible** result cards in the viewport (MVP) or visible + one screen above/below (stretch).

**Use cases:**

- eBay sold search (`/sch/` with sold filters)
- Craigslist search results
- Facebook Marketplace search grid
- OfferUp search results

**Limitation:** Does not auto-paginate or infinite-scroll fetch. User may capture again after scrolling and merge imports in Goblin (dedupe handles duplicates).

### Mode C — Copy JSON to clipboard (MVP export)

**Default export path for prototype.**

- Serializes `CompCaptureBatch` as formatted JSON
- Shows toast: "Copied N comps — paste into Marketplace Goblin"
- No network; no server

### Mode D — Future postMessage / app bridge

**Deferred until Goblin has stable hosted origin.**

| Mechanism | Notes |
|-----------|-------|
| `postMessage` to Goblin tab | Requires known origin allowlist |
| `chrome.runtime.sendMessage` + content script on Goblin | Only if Goblin is same extension ecosystem (unlikely) |
| Custom protocol / deep link | Store policy dependent |
| `localStorage` bridge key | Fragile across origins; clipboard preferred for MVP |

**Message contract (future):**

```text
type: MARKETPLACE_GOBLIN_COMP_IMPORT
payload: CompCaptureBatch
```

Goblin listener validates `schemaVersion`, size cap, and origin.

---

## 5. Permissions

### Required (MVP)

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access DOM of the tab the user clicked the extension on |
| `scripting` | Inject content script on demand (MV3 pattern) |
| `clipboardWrite` | Copy `CompCaptureBatch` JSON after user confirms |

### Host permissions

Site-specific host permissions listed in §2. Injected only on supported URLs.

### Optional (later)

| Permission | Purpose |
|------------|---------|
| `storage` | User prefs (default listing type, last platform) |
| `sidePanel` | Persistent capture UI (Chrome 114+) |

### Explicitly avoid

| Permission | Why |
|------------|-----|
| `cookies` | Not needed; no session replay |
| `webRequest` / `declarativeNetRequest` blocking | Not needed; not intercepting traffic |
| `background` persistent polling | Violates user-initiated guardrail |
| `<all_urls>` | Over-broad; store review risk |
| `tabs` (broad) | Only if needed for postMessage target discovery |

---

## 6. Data Shape

Use the **existing Phase 1 schema** without modification.

### `CompCaptureBatch` (extension export)

```json
{
  "schemaVersion": "1.0",
  "source": "extension",
  "platform": "eBay",
  "searchQuery": "Milwaukee M18 Fuel drill",
  "capturedAt": "2026-06-08T19:00:00.000Z",
  "pageUrl": "https://www.ebay.com/sch/i.html?_nkw=...",
  "comps": []
}
```

### `CapturedComp` (per row)

```json
{
  "title": "Milwaukee M18 Fuel Hammer Drill",
  "price": 89.99,
  "platform": "eBay",
  "listingType": "sold",
  "condition": "Good",
  "url": "https://www.ebay.com/itm/123456789",
  "imageUrl": "https://i.ebayimg.com/...",
  "capturedAt": "2026-06-08T19:00:00.000Z",
  "rawText": "Milwaukee M18 Fuel Hammer Drill $89.99 Sold",
  "confidence": {
    "title": "high",
    "price": "high",
    "listingType": "high",
    "platform": "high",
    "condition": "low"
  }
}
```

### Extension-specific conventions

| Field | Extension behavior |
|-------|-------------------|
| `source` | Always `"extension"` |
| `platform` | Batch-level default; per-comp override when mixed (rare) |
| `pageUrl` | `window.location.href` at capture time |
| `searchQuery` | From URL params when detectable (`_nkw`, `query`, etc.) or empty |
| `listingType` | Infer from page context; eBay sold search → `sold`; default `listed` when ambiguous |
| `condition` | Extract when visible; else omit (Goblin defaults `Good`) |
| `imageUrl` | Optional preview in extension UI only; Goblin does not persist |
| `rawText` | `innerText` snippet of card node for debug/re-parse |

### Import path in Goblin

```
CompCaptureBatch JSON
  → parseCompCaptureJson() / tryParseCompCaptureBatch()
  → normalizeCapturedComps({ existingComps, itemIdentity, compSearchQuery })
  → ComparableSale[]
  → Comparable Sales panel
```

See `src/lib/intake/comp-capture-import.ts` and `src/lib/types/comp-capture.ts`.

---

## 7. Per-site Extraction Strategy

### eBay (P0)

| Aspect | Detail |
|--------|--------|
| **Page types** | Search results `/sch/`, item `/itm/`, possibly product `/p/` |
| **Likely fields** | Title, price (sold or buy-it-now), item URL, thumbnail, sold date text, condition in subtitle |
| **listingType** | High confidence `sold` when URL contains `LH_Sold=1` or sold badge visible; else `listed` |
| **DOM issues** | Frequent A/B tests; sponsored cards mixed with organic; currency/locale formatting |
| **Risk level** | **Low–medium** — public listings; extension on user session |
| **Fallback** | Generic card capture: collect anchor + price regex from visible `li.s-item` blocks; include `rawText` |

**MVP selectors (indicative, not contractual):**

- Search cards: `.s-item`, `[data-viewport]`
- Title: `.s-item__title`, role=heading links
- Price: `.s-item__price`, `.s-item__detail--primary`
- Sold: `.s-item__title--tagblock .POSITIVE`, "Sold" text

### Craigslist (P1)

| Aspect | Detail |
|--------|--------|
| **Page types** | Search results `search/`, post detail |
| **Likely fields** | Title, price, post URL, hood/area text |
| **listingType** | Usually `listed` (asking); no native sold state |
| **DOM issues** | Minimal JS; regional subdomains; sparse price formatting ("$40 obo") |
| **Risk level** | **Medium** — Craigslist has historically enforced ToS against scrapers; user-initiated capture is lower risk |
| **Fallback** | Parse `result-row` / `.cl-search-result` rows; price regex on title line |

### Facebook Marketplace (P2)

| Aspect | Detail |
|--------|--------|
| **Page types** | Marketplace search, item detail |
| **Likely fields** | Title, price, listing URL, thumbnail |
| **listingType** | Almost always `listed` |
| **DOM issues** | Heavy SPA, obfuscated class names, login required, infinite scroll, virtualized lists |
| **Risk level** | **Medium–high** — Meta ToS restricts automated collection; user-initiated DOM read is the intended guardrail |
| **Fallback** | Generic visible `a[href*="/marketplace/item"]` + nearest price text; warn user to verify |

### OfferUp (P2)

| Aspect | Detail |
|--------|--------|
| **Page types** | Search results, item detail |
| **Likely fields** | Title, price, item URL |
| **listingType** | `listed` |
| **DOM issues** | SPA, Cloudflare, dynamic class names, location-dependent |
| **Risk level** | **Medium** |
| **Fallback** | Generic card walk: product links + `$` pattern in card `innerText` |

### Generic visible-page fallback (P1.5)

When site-specific parser fails:

1. Find repeating card-like elements (links with images + price pattern nearby)
2. Extract `{ title, price, url, rawText }` with low confidence
3. Show prominent "Review carefully" banner in popup
4. Set `confidence.*` to `low` where inferred

Used as safety net for Craigslist layout variants before Facebook/OfferUp-specific parsers ship.

---

## 8. Privacy / Legal Guardrails

> Not legal advice. Review with counsel before publishing to Chrome Web Store.

### Product rules (must ship in MVP)

| Rule | Implementation |
|------|----------------|
| **User-initiated only** | Capture runs on explicit button click in popup — never on page load |
| **No credential capture** | Do not read passwords, tokens, cookies, or `localStorage` auth keys |
| **No background crawling** | No `setInterval` polling, no pagination fetch, no scroll automation |
| **No bypassing access controls** | Do not scrape login walls, CAPTCHAs, or private API endpoints |
| **No private messages** | Ignore Messenger, OfferUp chat, seller contact modals |
| **No stored cookies** | Extension does not request `cookies` permission |
| **No server upload** | MVP exports to clipboard only; no analytics endpoint |
| **Minimal PII** | Do not extract seller name, phone, email, or exact address unless already in listing title (avoid even then) |
| **Transparent UI** | Show exactly what will be copied before export |

### Chrome Web Store positioning

- Category: **Productivity** / shopping assistant
- Description emphasizes: "Export listings you are viewing to your flip analysis tool"
- Privacy policy: no data collection by extension developer in MVP

### User-facing disclaimer (popup footer)

> Marketplace Goblin captures only what you see on this page when you click Capture. It does not access your passwords or messages. You choose what to import.

---

## 9. MVP Build Order

### Step 1 — Extension scaffold

- [ ] Manifest V3: `activeTab`, `scripting`, `clipboardWrite`, eBay host permission only
- [ ] Popup shell: site detector, disabled state on unsupported pages
- [ ] Content script loader on user action
- [ ] JSON serializer matching `CompCaptureBatch`

**Exit:** Extension loads on eBay; copies empty valid batch JSON.

### Step 2 — eBay capture (P0)

- [ ] Search results mode: visible `.s-item` cards
- [ ] Single listing mode: `/itm/` detail page
- [ ] Sold vs active detection from URL + badge text
- [ ] Popup preview table + remove row
- [ ] Copy JSON → paste into Goblin → import works

**Exit:** 3+ sold comps from eBay search imported into analyze draft.

### Step 3 — Craigslist (P1)

- [ ] Search result rows + detail page parser
- [ ] Default `listingType: listed`
- [ ] Host permission for `*.craigslist.org`

**Exit:** Local furniture/electronics search captures import cleanly.

### Step 4 — Generic visible-page fallback

- [ ] Heuristic card detection when site parser returns 0 rows
- [ ] Low-confidence flag in UI

**Exit:** Unknown CL layout still yields editable preview.

### Step 5 — Facebook Marketplace (P2)

- [ ] Login-aware: show message if not on marketplace route
- [ ] Search grid + item detail parsers
- [ ] Extra QA for DOM churn

### Step 6 — OfferUp (P2)

- [ ] Search + detail parsers
- [ ] Handle Cloudflare / empty result gracefully

### Step 7 — App bridge (post-MVP)

- [ ] Goblin `postMessage` listener
- [ ] Extension "Send to Goblin" button
- [ ] Origin allowlist

---

## 10. Open Questions

Decide before implementation:

| # | Question | Options / notes |
|---|----------|-----------------|
| 1 | **Monorepo vs separate repo** | Extension in `/extension` folder vs standalone repo |
| 2 | **Browser target** | Chrome-only MVP vs Chrome + Firefox (MV3 vs MV2) |
| 3 | **Build tooling** | Plain TS + esbuild vs Vite vs Plasmo |
| 4 | **Selector maintenance** | Per-site parser files vs config-driven selectors |
| 5 | **Capture scope** | Viewport-only vs full loaded DOM in container |
| 6 | **Scroll merge** | User manually re-captures vs "append to last batch" in extension |
| 7 | **Max comps per capture** | Align with Goblin cap of 50 per batch |
| 8 | **Condition extraction** | Site-specific vs always omit (Goblin defaults Good) |
| 9 | **searchQuery detection** | URL param parsing vs user editable field in popup |
| 10 | **Goblin hosted URL** | localhost dev vs production domain for future postMessage |
| 11 | **Extension branding** | Name in store: "Marketplace Goblin Comp Capture" |
| 12 | **Error telemetry** | None in MVP vs optional user-submitted debug bundle |
| 13 | **Side panel vs popup** | Popup sufficient for MVP? |
| 14 | **Firefox** | Defer or parity from day one |
| 15 | **Listing type override** | Global toggle in popup (force sold/listed) for ambiguous sites |

---

## Related documents

| Document | Role |
|----------|------|
| [`MARKETPLACE_GOBLIN_V2_DATA_ACQUISITION_SPEC.md`](./MARKETPLACE_GOBLIN_V2_DATA_ACQUISITION_SPEC.md) | Overall v2 hybrid strategy |
| [`JARVIS_PROJECT_STATE.md`](./JARVIS_PROJECT_STATE.md) | Shipped features + module map |
| `src/lib/types/comp-capture.ts` | `CompCaptureBatch` / `CapturedComp` types |
| `src/lib/intake/comp-capture-import.ts` | `normalizeCapturedComps()` import pipeline |

## Revision history

| Date | Change |
|------|--------|
| 2026-06-08 | Initial extension prototype spec |
