<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This is a single Next.js 16 application (no monorepo, no backend services, no database). All data persists in browser localStorage.

**Services:** Only the Next.js dev server is needed — `npm run dev` (port 3000).

**Standard commands** are documented in `README.md` under "Quick start":
- `npm install` — install deps
- `npm run dev` — dev server on :3000
- `npm run lint` — ESLint
- `npm run build` — production build

**Caveats:**
- No automated test suite exists yet; validation is manual (browser interaction).
- The app is fully client-side — no API routes, no auth, no external services to configure.
- Next.js 16.2.2 + React 19 — consult `node_modules/next/dist/docs/` for API changes before writing code.
