# Marketplace Goblin — Comp Capture Extension (Prototype)

Chrome/Edge MV3 extension that captures eBay search result cards and single listing pages, then exports a `CompCaptureBatch` JSON envelope for import into Marketplace Goblin.

**Scope (v0.2):** eBay search (`/sch/`, `/b/`) and single listing (`/itm/`) pages. No direct app connection yet — copy JSON and paste into Goblin.

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

### 5. Import into Marketplace Goblin

1. Return to Goblin → **Comparable Sales** panel
2. Open **Paste Comp Text / JSON**
3. Paste the copied JSON into the textarea
4. Click **Preview comps** → review import report
5. Click **Import N comps**
6. Confirm comps appear in the list and analysis updates

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
| `https://www.ebay.com/*` | eBay pages only |

No cookies, background polling, or external servers.

## Limitations (v0.2)

- **Viewport only on search pages** — captures visible `.s-item` cards; scroll and capture again to add more (Goblin dedupes on import)
- **Single listing** — one comp per `/itm/` page; sold/listed inferred from page text (lower confidence than sold-search context)
- **DOM fragility** — eBay layout changes may break selectors
- **Clipboard bridge** — no postMessage to Goblin yet; manual paste required
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
