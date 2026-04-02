# Bankroll Sidekick

Bankroll Sidekick is a lean, local-first poker bankroll tracker built with Next.js, TypeScript, Tailwind CSS, and lightweight shadcn-style UI components.

It is designed for one user running locally with no auth, no backend, and no cloud dependency. Everything is stored in browser localStorage, with JSON import/export for backups.

## Highlights

- Dark-mode-first, mobile-friendly UI
- Dashboard with bankroll health, P/L, withdrawals, win rate, average buy-in, and tier/status
- Quick-add session logger with automatic profit/loss calculation
- Editable and deletable session history
- Bankroll rules engine with:
  - stop-loss amount
  - withdrawal trigger amount
  - withdrawal amount
  - minimum bankroll floor
- Separate withdrawal tracking
- Analytics with Recharts:
  - bankroll over time
  - profit/loss by game type
  - withdrawals over time
  - biggest win/loss
  - average session result
  - longest upswing/downswing
  - best game type
- Tags and filters by game type, tag, and time window
- Settings page for starting bankroll, rules, preferred currency, import/export, and reset
- Seed data included so the app feels populated on first launch

## Tech stack

- Next.js
- TypeScript
- Tailwind CSS
- Recharts
- localStorage for persistence
- small shadcn-inspired UI primitives

## Getting started

### Requirements

- Node.js 20+ recommended
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

## Local-first data model

All app data is stored under a single localStorage key in the browser. The bankroll is derived from:

```text
starting bankroll + total deposits - total withdrawals + total session profit/loss
```

The app also supports:

- export all data to JSON
- import JSON backups
- reset back to included seed data

## Bankroll rule logic

The rules engine uses:

- `startingBankroll`
- `stopLossAmount`
- `withdrawalTriggerAmount`
- `withdrawalAmount`
- `minimumBankrollFloor`

### Effective baseline

The effective baseline is:

```text
starting bankroll + total withdrawals already secured outside bankroll
```

That means each logged withdrawal increases the baseline used for future withdrawal checkpoints.

Example:

- starting bankroll = 500
- withdrawal trigger = 150
- withdrawal amount = 100

When current bankroll reaches 650, the app suggests withdrawing 100.

After logging that withdrawal:

- active bankroll drops by 100
- secured amount increases by 100
- effective baseline becomes 600
- next trigger becomes 750

This keeps the logic simple and explicit for local tracking.

### Status labels

The app shows:

- `safe to play`
- `approaching stop-loss`
- `withdrawal available`
- `below bankroll floor`

Each status also includes a short explanation panel in the dashboard.

## Project structure

```text
src/
  app/
    layout.tsx
    page.tsx
    settings/page.tsx
    globals.css
  components/
    dashboard/
      dashboard-view.tsx
      withdrawal-panel.tsx
    sessions/
      session-form.tsx
      session-history.tsx
    settings/
      settings-view.tsx
    shared/
      app-provider.tsx
      confirm-dialog.tsx
      empty-state.tsx
      filters.tsx
      section-heading.tsx
      stat-card.tsx
    ui/
      button.tsx
      card.tsx
      dialog.tsx
      input.tsx
      label.tsx
      select.tsx
      tabs.tsx
      textarea.tsx
  lib/
    bankroll.ts
    seed-data.ts
    storage.ts
    types.ts
    utils.ts
```

## Notes

- No authentication is included.
- No external APIs or cloud services are required.
- The seed data is intended to demonstrate the dashboard immediately.
- Import normalization is tolerant of backups shaped slightly differently from the current schema.

