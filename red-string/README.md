# red.string

**Criminal network intelligence — the investigation UI.**

Prototype for **SIH26189 · AI-Powered Criminal Network Analysis System** (MHA · NCRB Women Safety
Division). This is the analyst-facing front end of CRIMENET-AI, rebranded `red.string` — the
evidence board where entities are nodes and resolved / suspicious connections are the red strings
between them.

Built for LEA officials: dense, functional, keyboard-fast, explainable. Every score on screen
clicks through to its source record.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build && npm run preview   # runs entirely from a static bundle, no backend
```

## What's here

| Route | Screen | Demo moment |
|---|---|---|
| `/` | Case dashboard | Person-projection graph, community colours, priority scores, IMEI pivot, money-path, time slider |
| `/ingest` | Collect & process sources | Drop / load a CSV → regex+NER extraction table with confidence → commit to graph |
| `/resolve` | Identity resolution queue | MERGE / **REFUSE** / REVIEW cards with evidence math; 2 planted wrong-merge traps |
| entity panel | Why-Flagged | Which of the 7 heuristics fired, adjustable weights, evidence chips |
| evidence drawer | Source records | Every evidence ID → verbatim FIR / CDR / transaction text |
| `/trust` | Custody hash-chain | Verify SHA-256 chain → green; **Tamper** flips one byte → red cascade |
| `/report/:id` | Court-ready report | Profile, ranked relationships, timeline, financial flows, hash manifest → Export PDF (print) |

Use **Reset demo** (top bar) between runs.

## Architecture

- **Vite + React + TypeScript**, Tailwind + hand-rolled shadcn/ui components, dark only.
- **Cytoscape.js** (`fcose` layout) for the network graph. A React Flow "evidence board" mode is
  a documented future option, not built.
- No backend. `src/lib/api/` is a typed, async, latency-simulating mock shaped like the future
  FastAPI contract; a real service can replace it without touching callers.
- `src/lib/fixtures/dataset.ts` — the MVP dataset (20 persons + phones/accounts/vehicles/
  locations/cases, ~80 relationships). Analytics (priority scores, communities, fired heuristics)
  are pre-computed; the UI never recomputes them.
- `src/lib/hash/chain.ts` — real SHA-256 hash-chain via Web Crypto.

## Smoke test

```bash
npx vite-node scripts/smoke.tsx   # SSR-renders every page + exercises the mock API
```

Synthetic data. Human-in-the-loop. No automated adverse decision.
