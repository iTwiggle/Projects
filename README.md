# Concept Forge

**AI-Powered App Refinery & Idea Mutation Engine**

Turn vague interests and fragmented ideas into refined, strategically useful software concepts.

## Features (MVP v1)

- **Idea Input Engine** — Multi-channel tag inputs for interests, industries, frustrations, hobbies, tech, skills, and random sparks
- **AI Concept Generator** — Rich concept cards with full strategic intel (mock engine for local iteration; API-ready architecture)
- **Mutation Engine** — Remix, evolve, curse, simplify, scale, B2B/creator pivots, and concept fusion
- **Scoring System** — Weighted viability matrix with radial charts, spectrum bars, and heatmaps
- **Concept Vault** — localStorage persistence, favorites, search, mutation lineage

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Framer Motion
- Lucide React
- Recharts (reserved for future analytics)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
src/
├── app/              # Routes (forge + vault)
├── components/
│   ├── forge/        # Product UI
│   ├── layout/       # Shell + background
│   ├── scoring/      # Visualization
│   └── ui/           # shadcn primitives
├── hooks/            # useForge state orchestration
├── lib/
│   ├── concept-generator.ts  # Mock AI (swap for API)
│   ├── mutation-engine.ts
│   ├── scoring.ts
│   └── storage.ts
└── types/            # Domain models
```

## Future Expansion (not in MVP)

Trend ingestion, competitor analysis, wireframe generation, pitch decks, founder personality analysis — architected for modularity but intentionally not built yet.

## License

Private — startup prototype.
