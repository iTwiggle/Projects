# Marketplace Goblin — Comp Capture Extension (Prototype)

Chrome/Edge MV3 extension that captures **visible** eBay search result cards and exports a `CompCaptureBatch` JSON envelope for import into Marketplace Goblin.

**Scope (v0.1):** eBay search pages only. No direct app connection yet — copy JSON and paste into Goblin.

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
2. Confirm status shows **Ready on eBay search (sold filter detected)**
3. Click **Capture visible eBay comps**
4. Review the preview list (title, sold/listed, price)
5. Click **Copy JSON to clipboard**

### 3. Import into Marketplace Goblin

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

## Permissions

| Permission | Why |
|------------|-----|
| `activeTab` | Read the tab you clicked the extension on |
| `scripting` | Inject capture script on demand |
| `clipboardWrite` | Copy JSON after you confirm |
| `https://www.ebay.com/*` | eBay pages only (v0.1) |

No cookies, background polling, or external servers.

## Limitations (v0.1)

- **Viewport only** — captures visible `.s-item` cards; scroll and capture again to add more (Goblin dedupes)
- **Search pages only** — `/sch/` and `/b/` paths; single `/itm/` listing pages not supported yet
- **DOM fragility** — eBay layout changes may break selectors
- **Clipboard bridge** — no postMessage to Goblin yet; manual paste required
- **Sponsored/promo rows** — best-effort filtering; review preview before copy
- **Sold detection** — uses URL `LH_Sold=1` + card text; may mislabel ambiguous rows

## Project structure

```
extension/
  manifest.json
  icons/
  lib/
    schema.js
    ebay-parser.js          # ES module (reference)
    ebay-parser-global.js   # Injected into eBay tab
  content/
    ebay-capture.js         # DOM extraction
  popup/
    popup.html
    popup.css
    popup.js
```

## Development

No build step required — reload the extension on `chrome://extensions` after editing files.
