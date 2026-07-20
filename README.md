# Marketplace Goblin

Evaluate marketplace finds before you buy. Hunt treasures, skip traps, flip with confidence.

**Live question answered:** *Is this actually a good deal?*

## Features

- **Deal Input Form** — Item name, category, asking price, condition, resale estimate, notes
- **Deal Analysis Engine** — Profit, ROI %, risk score, flip score, time-to-sell estimate
- **Goblin Verdict** — Goblin Approved, Proceed With Caution, or Leave It In The Cave
- **Saved Deals** — Save, edit, and delete deals via localStorage
- **Dashboard** — Total deals, potential profit, average ROI, best deal

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- No backend, no auth

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run dev` uses webpack (not Turbopack) so a stray parent `package-lock.json`
(e.g. in your home directory) cannot break Tailwind CSS resolution.

Load the Chrome/Edge extension from the `extension/` folder (unpacked) for eBay
comps and Facebook Marketplace listing capture. Direct **Send to Goblin** works
against a Goblin tab on `localhost` / `127.0.0.1`.

## Scripts

```bash
npm run dev      # Start dev server (webpack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
npm run test     # Vitest
```
