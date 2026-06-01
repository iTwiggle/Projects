# Concept Forge — Desktop Handoff (Windows / Cursor)

Use this guide when you open the repo later on your Windows machine in Cursor. No app code changes are required—only setup and verification.

---

## Branch to use

**`cursor/concept-forge-mvp-fc8d`**

This branch contains the full Concept Forge MVP and the localStorage hydration fix.

| Commit     | Description |
|-----------|-------------|
| `c6a7383` | **localStorage fix** — skips the first save after hydration so restored data is not overwritten with empty state |
| `25aa692` | MVP — forge UI, mock generator, mutations, scoring, vault |

Do **not** use `main` for development unless it has been merged; `main` may only have the initial empty commit.

---

## Exact git commands

Open **PowerShell** or **Git Bash** in Cursor’s terminal (`Ctrl+`` `).

### First time (clone)

```bash
git clone https://github.com/iTwiggle/Projects.git
cd Projects
git fetch origin cursor/concept-forge-mvp-fc8d
git checkout cursor/concept-forge-mvp-fc8d
```

### Already cloned (update)

```bash
cd Projects
git fetch origin
git checkout cursor/concept-forge-mvp-fc8d
git pull origin cursor/concept-forge-mvp-fc8d
```

### Confirm you’re on the right commit

```bash
git branch --show-current
git log -1 --oneline
```

Expected:

```text
cursor/concept-forge-mvp-fc8d
c6a7383 fix: skip initial localStorage save after hydration to prevent data wipe
```

---

## Exact npm commands

**Prerequisites:** Node.js **18.18+** or **20+** (LTS recommended). Check with:

```bash
node -v
npm -v
```

From the repo root (folder containing `package.json`):

```bash
npm install
npm run dev
```

Optional but recommended before you trust the environment:

```bash
npm run build
npm run lint
```

Production-style run (after a successful build):

```bash
npm run start
```

---

## URLs to open

| URL | What it is |
|-----|------------|
| http://localhost:3000 | **Forge** — input reactor, concept cards, scoring, mutations |
| http://localhost:3000/library | **Vault** — search and browse saved concepts |

Default Next.js dev port is **3000**. If the terminal says another port (e.g. `3001` because 3000 is busy), use that port instead.

---

## What success looks like

1. `npm install` finishes without errors (warnings about funding/audit are OK).
2. `npm run dev` prints something like:
   ```text
   ▲ Next.js 16.x.x
   - Local: http://localhost:3000
   ```
3. Browser shows a **dark** UI with header **“Concept Forge”** and subtitle **“Idea Reactor Core”**.
4. Brief **“Initializing reactor…”** then the three-column forge layout (stacks on narrow windows).
5. **Ignite Reactor** generates three concept cards with scores and expandable details.
6. Refreshing the page **keeps** your tags and concepts (localStorage key: `concept-forge-state-v1`).
7. `/library` lists concepts you generated on the forge (same localStorage).

---

## First 5 manual tests

### 1. Generate concepts

1. Open http://localhost:3000
2. Add tags under **Interests** (e.g. `music production`, `ADHD`)
3. Click **Quick Seeds → Creator Lab** (optional)
4. Click **Ignite Reactor**
5. **Pass:** Three new concept cards appear with names, pitches, novelty/fit numbers

### 2. Expand and score

1. Click a concept card to select it
2. Expand **“Expand intel”** on a card
3. Check the right column **Viability Matrix** (composite radial + bars/heatmap tabs)
4. **Pass:** Scores animate; composite label shows (e.g. Strong / Viable)

### 3. Mutate a concept

1. With a concept selected, click **More Cursed** or **Simpler** in **Mutation Engine**
2. **Pass:** New card appears at top with mutation badge; parent lineage via `parentId` in data

### 4. localStorage persistence (includes `c6a7383` fix)

1. Generate at least one concept and add input tags
2. Hard refresh the page (`Ctrl+Shift+R`)
3. **Pass:** Tags and concepts are still there (not wiped to empty)
4. Open DevTools → Application → Local Storage → `concept-forge-state-v1` — should contain JSON

### 5. Vault + favorites

1. On the forge, click the **heart** on a concept
2. Go to http://localhost:3000/library
3. **Pass:** Concept appears in the list; **Favorites only** filter shows favorited items  
   **Note:** Favorite toggle on the vault page is read-only in MVP (no handlers wired there)—favorite from the forge.

---

## localStorage fix reminder

**Commit `c6a7383`** fixes a race where the first save after hydration could run **before** restored state was applied, overwriting saved data with empty defaults.

If you are debugging persistence:

- Ensure `git log -1` shows `c6a7383` or later on `cursor/concept-forge-mvp-fc8d`
- Look for `skipNextSaveRef` in `src/hooks/use-forge.ts`
- Storage key: `concept-forge-state-v1`

---

## Likely errors and exact fixes

### `next` is not recognized / `npm run dev` fails immediately

**Cause:** Dependencies not installed or wrong folder.

```bash
cd path\to\Projects
npm install
npm run dev
```

---

### Node version too old

**Symptom:** Engine errors, odd Next.js failures.

```bash
node -v
```

**Fix:** Install Node 20 LTS from https://nodejs.org/, restart terminal, then `npm install` again.

---

### Port 3000 already in use

**Symptom:** `EADDRINUSE` or Next suggests port 3001.

**Fix A:** Use the URL printed in the terminal (e.g. http://localhost:3001).

**Fix B:** Free port 3000 (PowerShell):

```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Then `npm run dev` again.

---

### Empty UI after refresh (old build without `c6a7383`)

**Symptom:** Concepts disappeared after reload once, or storage looks empty right after load.

**Fix:**

```bash
git checkout cursor/concept-forge-mvp-fc8d
git pull origin cursor/concept-forge-mvp-fc8d
git log -1 --oneline
```

Must show `c6a7383`. Restart dev server.

---

### `npm run build` / TypeScript errors on fresh clone

**Cause:** `.next` or generated types missing.

```bash
npm install
npm run build
```

`next-env.d.ts` is gitignored; Next generates it on build/dev. Do not hand-edit it.

---

### Styling broken (no dark theme / unstyled HTML)

**Cause:** Tailwind v4 pipeline not running or install incomplete.

```bash
rm -rf node_modules .next
npm install
npm run dev
```

On Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules, .next
npm install
npm run dev
```

---

### ESLint warnings only (not failures)

**Symptom:** `npm run lint` exits 0 but warns about `_t` in `concept-generator.ts`.

**Fix:** None required for local dev; warnings are cosmetic.

---

### Wrong branch (blank or old README only)

**Symptom:** No Concept Forge UI, or missing `src/components/forge`.

```bash
git fetch origin
git checkout cursor/concept-forge-mvp-fc8d
git pull origin cursor/concept-forge-mvp-fc8d
```

---

### Execution policy blocks npm (PowerShell)

**Symptom:** Scripts cannot be run on this system.

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Then retry `npm run dev`. Alternatively use **Git Bash** for npm commands.

---

## Quick reference

| Item | Value |
|------|--------|
| Branch | `cursor/concept-forge-mvp-fc8d` |
| Persistence fix commit | `c6a7383` |
| Dev command | `npm run dev` |
| Forge URL | http://localhost:3000 |
| Vault URL | http://localhost:3000/library |
| localStorage key | `concept-forge-state-v1` |
| Stack | Next.js 16, React 19, Tailwind 4, shadcn/ui, Framer Motion |

---

## After you’re running

- Mock AI lives in `src/lib/concept-generator.ts` and `src/lib/mutation-engine.ts` — swap for a real API later without changing the UI contract in `src/types/concept.ts`.
- Project README: `/README.md`
- This handoff: `/docs/DESKTOP_HANDOFF.md`
