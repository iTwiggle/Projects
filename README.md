# Bankroll Sidekick

Bankroll Sidekick is a lean, local-first poker bankroll and session tracker.

It is designed for serious tracking:
- fast logging
- clear bankroll/risk state
- no auth
- no cloud dependency
- mobile-friendly
- dark mode by default

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- browser localStorage for persistence

## Quick start

### 1) Install

```bash
npm install
```

### 2) Run

```bash
npm run dev
```

Open `http://localhost:3000`.

### 3) Build / lint

```bash
npm run lint
npm run build
```

## Core features (V1)

### Dashboard
- current bankroll
- total P/L
- total withdrawals
- total deposits
- session win rate
- average buy-in
- bankroll tier/status
- rule-state explanation panel
- today status card

### Session logger
- add/edit/delete sessions
- fields: date, game type, buy-in, entries/rebuys, total invested, cashout, notes, optional duration, tags
- auto profit/loss = cashout - invested
- filter history by:
  - game type
  - tag
  - range (7d / 30d / all)

### Bankroll rules engine
Custom rules:
- stop-loss amount
- withdrawal trigger amount
- withdrawal amount
- minimum bankroll floor

State output:
- safe to play
- approaching stop-loss
- withdrawal available
- below bankroll floor

### Withdrawal + deposit tracker
- separate logging for withdrawals and deposits
- running secured amount outside bankroll
- keeps bankroll growth vs removed money clear

### Analytics
- bankroll over time chart
- P/L by game type
- withdrawals over time
- biggest win/loss
- average session result
- streak tracking (upswing / downswing)
- best game type summary

### Data management
- export JSON backup
- import JSON backup (paste or file)
- load seed data example
- reset all data (confirmation modal)

## Project structure

```text
src/
  app/
    page.tsx                    # main app route
    settings/page.tsx           # bankroll + rules + currency settings
    layout.tsx                  # dark-mode-first root layout
  components/
    bankroll-sidekick-app.tsx   # main UI shell and feature tabs
    ui/*                        # shadcn/ui primitives
  hooks/
    use-app-data.ts             # localStorage hydration + persistence
  lib/
    types.ts                    # core domain types
    constants.ts                # app constants/default state
    seed.ts                     # seed example dataset
    bankroll.ts                 # bankroll math, filters, analytics, rules engine
    storage.ts                  # import/export + normalization + localStorage IO
    format.ts                   # display formatting helpers
```

## Bankroll logic

Primary bankroll formula:

```text
bankroll = starting bankroll + deposits - withdrawals + total session profit/loss
```

Rules engine behavior:

1. `effectiveBaseline` starts from `startingBankroll`.
2. Completed withdrawal cycles increase effective baseline:
   - `cyclesCompleted = floor(totalWithdrawals / withdrawalAmount)`
   - `effectiveBaseline = startingBankroll + cyclesCompleted * withdrawalAmount`
3. Important lines:
   - `stopLossLine = effectiveBaseline - stopLossAmount`
   - `triggerLine = effectiveBaseline + withdrawalTriggerAmount`
4. Current status derives from bankroll position vs these lines + floor.

Example strategy supported:
- baseline = $500
- trigger = +$150
- withdraw = $100 each trigger hit
- baseline climbs as withdrawals accumulate

## Local-first behavior

- All data is stored in browser localStorage.
- No backend/database required.
- App works offline once loaded.
- JSON export/import provides portable backups.

## Seed data

Use **Data -> Load seed data** to quickly populate:
- example sessions
- a sample withdrawal
- sample notes/tags

## Deploy to Vercel

Bankroll Sidekick is ready to deploy as-is. No environment variables, databases, or backend services are required.

### Steps

1. Push this repository to GitHub (or GitLab / Bitbucket).
2. Go to [vercel.com](https://vercel.com) and sign in (or create a free account).
3. Click **Add New...** → **Project**.
4. Import the repository.
5. Vercel auto-detects Next.js — accept the defaults:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
6. Click **Deploy**. The build takes about 30 seconds.

That's it. Vercel gives you a URL like `https://your-project.vercel.app`. Open it on your phone — it works immediately.

### Custom domain (optional)

In your Vercel project → **Settings** → **Domains**, add a custom domain (e.g. `bankroll.yourdomain.com`). Vercel handles HTTPS automatically.

### How it works on Vercel

- The app runs as a standard Next.js deployment (server-rendered shell + client hydration).
- All data stays in your **browser's localStorage** — nothing is sent to a server.
- Each device/browser has its own independent data. Use **Data → Export** to move data between devices.
- No environment variables or secrets are needed.

## Notes

- Currency options are simple and local.
- Inputs are sanitized to prevent broken numeric state.
- Import is normalized/validated before writing to state.
