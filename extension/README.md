# Marketplace Goblin — Comp Capture Extension (Prototype)

Chrome/Edge MV3 extension that captures eBay search result cards and single listing pages, then exports a `CompCaptureBatch` JSON envelope for import into Marketplace Goblin.

**Scope (v0.3):** eBay search (`/sch/`, `/b/`) and single listing (`/itm/`) pages. Same-browser direct import to localhost Goblin via postMessage, with clipboard JSON as fallback.

## Prerequisites

- Google Chrome or Microsoft Edge (Chromium)
- Marketplace Goblin running locally or deployed (for import step)

## Load unpacked (Chrome)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this folder: `extension/` (the directory containing `manifest.json`)
5. Pin **Marketplace Goblin Comp Capture** to the toolbar

## Load unpacked (Edge)

1. Open `edge://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder

## Manual test — full loop

### 1. eBay sold search

1. In Marketplace Goblin, analyze a deal (e.g. `Milwaukee M18 Fuel drill`)
2. Use **Comp search links** → **eBay sold** (or open manually):
   `https://www.ebay.com/sch/i.html?_nkw=Milwaukee+M18+Fuel&LH_Sold=1&LH_Complete=1`
3. Scroll so several `.s-item` result cards are visible

### 2. Capture with extension

1. Click the extension icon
2. Confirm status shows **Ready on eBay search results · sold filter**
3. Read the scroll hint: *Scroll the eBay page to load more results, then capture again*
4. Click **Capture visible eBay comps**
5. Review the **stats panel**:
   - **Captured this run** — comps added in this capture
   - **Valid comps** — comps that passed filters and will be in the JSON
   - **Likely duplicates** — same title/price/url seen twice in the viewport
   - **Skipped rows** — sponsored, promo, empty, or unparseable cards
6. Review the preview list (title, sold/listed, price, low-confidence badge when ambiguous)
7. Click **Copy JSON to clipboard**

### 3. Scroll and capture again (optional)

1. Scroll the eBay page to load more results
2. Click **Capture visible eBay comps** again
3. Confirm stats update and toast reminds you to scroll for more if needed
4. Copy JSON from the latest capture (or combine batches by importing each into Goblin — Goblin dedupes)

### 4. Single listing page (`/itm/`)

1. Open any eBay item page, e.g. `https://www.ebay.com/itm/123456789`
2. Click the extension icon — status should show **Ready on eBay listing page**
3. Click **Capture this listing**
4. Confirm stats show 1 valid comp (or 1 skipped if title/price missing)
5. Copy JSON and import into Goblin

### 5. Direct import (Send to Goblin)

1. In Goblin → **Comparable Sales** → click **Listen for extension import**
2. Confirm the green listening banner is visible (times out after 2 minutes of inactivity; cancel anytime)
3. In the extension popup, click **Send to Goblin**
4. Goblin shows import preview + report — review warnings and duplicates
5. Click **Import N comps** to confirm (never auto-imported)

### 6. Clipboard fallback

1. Click **Copy JSON to clipboard** in the extension
2. In Goblin → **Paste Comp Text / JSON** → paste → **Preview comps** → **Import N comps**
3. Confirm comps appear in the list and analysis updates

## Output schema

Matches `CompCaptureBatch` / `CapturedComp` in `src/lib/types/comp-capture.ts`:

- `schemaVersion`: `"1.0"`
- `source`: `"extension"`
- `platform`: `"eBay"`
- `comps[]`: title, price, platform, listingType, url, imageUrl, capturedAt, rawText, confidence

Clipboard copies **only** the batch object (no stats wrapper).

## Permissions

| Permission | Why |
|------------|-----|
| `activeTab` | Read the tab you clicked the extension on |
| `scripting` | Inject capture script on demand |
| `clipboardWrite` | Copy JSON after you confirm |
| `https://www.ebay.com/*` | eBay capture pages |
| `http://localhost/*`, `http://127.0.0.1/*` | Send to local Marketplace Goblin tab only |
| `tabs` | Find open Goblin tabs on localhost for Send to Goblin |

No cookies, background polling, accounts, servers, auth, sync, or permanent pairing.

## Limitations (v0.3)

- **Viewport only on search pages** — captures visible `.s-item` cards; scroll and capture again to add more (Goblin dedupes on import)
- **Single listing** — one comp per `/itm/` page; sold/listed inferred from page text (lower confidence than sold-search context)
- **DOM fragility** — eBay layout changes may break selectors
- **Local prototype only** — Send to Goblin targets `localhost` / `127.0.0.1` in the same browser; no hosted URL pairing yet
- **User-initiated** — Goblin must be in Listen mode; imports always require preview + confirm
- **Clipboard fallback** — Copy JSON still supported when direct send fails
- **Filtering is best-effort** — sponsored, “Shop on eBay”, and empty placeholder rows are skipped when detected; review preview before copy
- **Sold detection** — uses URL `LH_Sold=1` / `LH_Complete=1` plus row text; ambiguous rows get `listingType` confidence `low` in preview
- **No other platforms** — Facebook, Craigslist, OfferUp not supported yet

## Project structure

```
extension/
  manifest.json
  icons/
  lib/
    schema.js
    ebay-parser.js          # ES module (reference + vitest)
    ebay-parser-global.js   # Injected into eBay tab
    goblin-bridge.js        # Send to Goblin postMessage bridge
  content/
    ebay-capture.js         # DOM extraction + stats
  popup/
    popup.html
    popup.css
    popup.js
  fixtures/
    sample-ebay-batch.json
```

## Development

No build step required — reload the extension on `chrome://extensions` after editing files.

Parser unit tests live in the main app: `npm run test -- src/lib/extension/`
