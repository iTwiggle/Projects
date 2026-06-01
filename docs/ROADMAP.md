# Concept Forge — Roadmap

Practical sequencing for a solo founder or small team. Each phase has a clear **done** state. Do not start the next phase until the current one ships and feels solid.

**Principle:** Depth over breadth. One excellent loop beats ten half-built modules.

---

## V0 — Shell complete ✅

**Status:** Shipped on `cursor/concept-forge-mvp-fc8d`

What exists:

- Next.js App Router + TypeScript + Tailwind v4 + shadcn/ui + Framer Motion
- Dark forge UI (input reactor, concept cards, scoring viz, mutation panel)
- Mock concept generator + mutation engine (deterministic, input-seeded)
- localStorage persistence (`concept-forge-state-v1`, hydration fix in `c6a7383`)
- Concept Vault (`/library`) — browse and search

**Done when:** You can run `npm run dev`, forge concepts, mutate them, refresh without data loss, and demo the product in under 2 minutes.

**Not in scope:** Auth, backend, real AI, exports, trends, wireframes.

---

## V1 — Frontend prototype polish

**Goal:** Make the prototype feel inevitable to use — not “AI demo,” but “idea workbench.”

| Priority | Work |
|----------|------|
| Must | Mobile pass: column order, sticky panels, touch targets, scroll traps in input panel |
| Must | Empty states with one clear CTA (no dead screens) |
| Must | Loading / mutation feedback that feels intentional (not generic spinners everywhere) |
| Must | Vault parity: favorite/unfavorite from `/library` (shared state with forge) |
| Should | Concept compare mode polish (side-by-side diff, not just score snippet) |
| Should | Keyboard: Enter to add tags, Escape to collapse cards |
| Could | Subtle sound or haptic hooks (off by default) |

**Done when:** A stranger uses it for 10 minutes without asking “what do I click?” and nothing feels broken on a phone.

**Anti-creep:** No new product surfaces. No accounts. No API. Polish what exists.

---

## V1.5 — Real AI generation

**Goal:** Replace mock engines with real inference while keeping the same `Concept` contract in `src/types/concept.ts`.

| Priority | Work |
|----------|------|
| Must | `POST /api/generate` — accepts `ConceptInput`, returns `Concept[]` (structured JSON) |
| Must | `POST /api/mutate` — accepts `conceptId` + `MutationType`, returns `Concept` |
| Must | System prompt enforces product rules (no Uber-for-X, specificity, failure modes, etc.) |
| Must | Client flag or env: `USE_MOCK_AI=true` for offline/dev fallback |
| Should | Rate limiting + basic error UI (timeout, malformed JSON, retry) |
| Should | Optional: stream pitch first, fill scores second (perceived speed) |
| Could | User-provided API key (local only) before you pay for hosted inference |

**Done when:** Same UI, but concepts feel meaningfully tied to user inputs and mutations produce coherent deltas — not template shuffle.

**Anti-creep:** One model provider first. No RAG, no Reddit scraping, no “research mode” yet.

---

## V2 — Score-weight customization

**Goal:** Let founders tune what “viability” means *for them* — the scoring system becomes a lens, not a verdict.

| Priority | Work |
|----------|------|
| Must | UI sliders for `ScoreWeights` (already in types + `useForge`) |
| Must | Live composite score update as weights change |
| Must | Persist weights in localStorage (already partially wired) |
| Should | 2–3 presets: “Bootstrapper”, “Creator”, “B2B operator” |
| Should | Show which dimensions moved the composite most (simple bar delta) |
| Could | Export weights as JSON snippet for sharing |

**Done when:** Changing weights visibly re-ranks concepts and users understand *why* without reading code.

**Anti-creep:** No ML-trained personal weights. No “founder personality test.” Sliders and presets only.

---

## V3 — Project export / scaffolding

**Goal:** Close the loop from idea → artifact you can actually open in an editor.

| Priority | Work |
|----------|------|
| Must | Export concept as Markdown (Notion/Obsidian-friendly) |
| Must | Export as JSON (full `Concept` object) |
| Should | “MVP brief” one-pager PDF or printable HTML |
| Should | Optional: generate `README.md` + folder stub (name, pitch, mvpScope as checklist) — **no** full codebase gen |
| Could | Copy-to-clipboard blocks per section (problem, MVP scope, monetization) |

**Done when:** User leaves with a file they can paste into their notes or repo in one click.

**Anti-creep:** Not “generate full Next app.” Not CI, not deployment. Export and light scaffolding only.

---

## Future wildcards

Ideas worth **not** building until V1.5–V3 are boring and stable. Park them here so they do not infect the MVP.

| Idea | Why wait |
|------|----------|
| Trend ingestion (Twitter, Product Hunt, etc.) | Needs data pipeline + freshness; distracts from core forge loop |
| Reddit / forum scraping | Legal, brittle, noisy — better as manual paste in V1.5 prompts first |
| Competitor database | High research cost; easy to ship junk comparisons |
| AI wireframes | Different product; huge scope |
| Full MVP codebase generator | Support burden, security, quality trap |
| Founder personality analysis | Fun demo, weak moat, privacy friction |
| Pitch deck generation | Useful but separate workflow; do after export works |
| Investor mode | Wrong audience until you have paying users |
| Monetization simulation | Fake precision; hurts trust |
| Auth + cloud sync | Only when solo localStorage is a proven pain |
| Team workspaces | After auth, after export, after real AI |

**Rule for wildcards:** Promote to roadmap only if three users ask for it the same way, or it unlocks the core loop (input → concept → mutate → decide → export).

---

## Suggested timeline (effort, not calendar)

| Phase | Relative effort | Depends on |
|-------|-----------------|------------|
| V0 | Done | — |
| V1 | Small–medium | Design eye, device testing |
| V1.5 | Medium | API keys, prompt tuning, eval set |
| V2 | Small | V1 UI stable |
| V3 | Small–medium | V1.5 concepts worth exporting |

Work **V1 → V1.5 → V2 → V3** in that order. Skipping V1 before real AI ships broken UX with expensive tokens.

---

## What we are not building (ever, unless the product pivots)

- Generic startup idea spam generator
- Motivational / hustle content
- Blockchain-by-default suggestions
- Enterprise SSO, RBAC, audit logs
- Another chat thread with no structure

Concept Forge wins when it feels like **evolutionary concept engineering** — constrained, scored, mutable, exportable.

---

## Reference

- Desktop setup: [`docs/DESKTOP_HANDOFF.md`](./DESKTOP_HANDOFF.md)
- Domain types: `src/types/concept.ts`
- Mock engines (swap targets for V1.5): `src/lib/concept-generator.ts`, `src/lib/mutation-engine.ts`
