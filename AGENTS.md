<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Overview

Bankroll Sidekick is a local-first poker bankroll tracker. It is a single Next.js 16 app with no backend, no database, and no external services. All data is stored in browser `localStorage`.

### Running the app

- `npm run dev` starts the dev server on port 3000.
- `npm run lint` runs ESLint (flat config, `eslint.config.mjs`).
- `npm run build` runs a production build (includes TypeScript checking).
- There are no automated tests configured; validation is via lint + build + manual browser testing.

### Caveats

- The `main` branch contains only a placeholder README. Application code lives on feature branches (e.g. `cursor/bankroll-sidekick-mvp-5070`). Check out the relevant feature branch before running any commands.
- No `.env` file or secrets are needed.
- The app uses Next.js 16 with React 19 and Tailwind CSS v4. Consult `node_modules/next/dist/docs/` for API guidance as noted in the existing AGENTS.md rules above.
