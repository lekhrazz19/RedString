# SIH Portal Submission PPT — 6-Slide Content Design & Copy
# SIH26189 · CRIMENET-AI · by Sept 20

## 1. Deliverable & hard constraints

| Constraint | Value |
|---|---|
| Target | SIH Portal national screening (evaluated centrally, NO presenter present) |
| Slides | Exactly 6 (including title) — official template |
| Format | PDF only (no PPTX/Word) |
| Style | Points / diagrams / infographics / images — NO paragraphs |
| Evaluator time | 2–3 min per submission, scan-first |
| Must keep | Official section pointers (can't remove the required bullets per section) |
| Depth strategy | Strict template + visual depth (diagrams + prototype screenshot + quantified numbers) |

## 2. Evaluation weights (what the evaluator scores)

| Criteria | Weight |
|---|---|
| Innovation & uniqueness | 25% |
| Problem understanding & clarity | 20% |
| Technical feasibility | 20% |
| Impact & scalability | 20% |
| Presentation quality & clarity | 15% |

## 3. Design principles (from winners' research)

1. **One message per slide** — each of the 6 slides sells exactly one thing.
2. **Visual proof beats claims** — charts, graphs, prototype UI screenshot, architecture diagram. Winners' #1 shared trait: data visualization.
3. **Quantified numbers, not adjectives** — "entity-resolution F1 0.91", "key entity in <2 min", "verify chain breaks on 1-byte tamper". KAVACH won on staged numbers.
4. **Self-contained** — evaluator reads it cold; the story must complete without us talking.
5. **Purposeful buzzwords only** — knowledge graph, entity resolution, network projection, SHA-256 hash-chain — each tied to a real feature, never filler.
6. **Innovation framed, not just stated** — REFUSE card is THE differentiator; make it impossible to miss.
7. **No predictive-policing framing** — human-in-the-loop, DPDP-aligned, "ranks relationships for investigator review".

## 4. MHA requested bullets → how we cover them (source of truth for Slide 2)

| MHA "Expected Solution" bullet | Our component |
|---|---|
| Collect & process data from multiple sources | INGEST |
| Extract entities (people, locations, vehicles, phones, orgs) | INGEST + RESOLVE |
| Build relationship maps | NETWORK |
| Identify key individuals with influential roles | NETWORK (projection + centrality) |
| Detect suspicious patterns & unusual activities | NETWORK (7 heuristics) |
| Visual & analytical insights for investigators | NETWORK + REPORT + UI |

---

## 5. THE 6 SLIDES — exact content

### Slide 1 — TITLE (per official template pointer)

**Layout:** clean title card.

**Header block:**
- Problem Statement ID: **SIH26189**
- Problem Statement Title: **AI-Powered Criminal Network Analysis System**
- Theme: **Blockchain & Cybersecurity**
- PS Category: **Software**
- Team ID: **[portal]**
- Team Name: **[portal]**

**Main:** Title art — "CRIMENET-AI"
**Tagline (one line, under title):**
> Evidence-backed criminal network intelligence — from fragmented records to court-ready evidence.

**Optional:** small architecture mini-diagram strip or hero screenshot of the graph. Keep minimal.

---

### Slide 2 — PROPOSED SOLUTION (official pointer)

**Pointer required:** "Detailed explanation of the proposed solution · How it addresses the problem · Innovation and uniqueness"

**Visual (left 60%):** 5-component pipeline diagram:
```
INGEST → RESOLVE ★ → NETWORK → TRUST → REPORT
(xlsx/csv/  (merge/     (person-    (SHA-256   (court-ready
 txt/json)   refuse/    person      hash-chain PDF)
             review)    projection, custody)
                        rank, pivots)
```

**Points (right 40%):**
- **Problem (1 line):** Investigators manually chart fragmented FIR, phone, financial & vehicle records — takes days, misses hidden links, and AI scores aren't trusted in court.
- **How it addresses it:** Ingest → resolve identities across sources → build relationship graph → rank who to investigate with evidence attached → generate court-ready PDF.
- **Innovation:** Live **REFUSE cards** — the system *rejects* false identity matches (same name, different person) and shows why. Covers MHA's full "Expected Solution" list (see mapping table).

**Bottom strip:** MHA bullet → component mini-mapping (compact table, small font, 6 rows).

---

### Slide 3 — TECHNICAL APPROACH (official pointer)

**Pointer required:** "Technologies to be used · Methodology and process for implementation (flowcharts/images/working prototype)"

**Visual (left 50%):** 4-step methodology flow:
```
1 Ingest    → 2 Resolve   → 3 Analyze    → 4 Report
multi-format  multi-signal   person-person   custody-chained
parsers +     entity         projection →    PDF + Why
regex-first   resolution +   centrality +    Flagged +
extraction    REFUSE cards   Louvain + 7      verify chain
                            heuristics
```

**Tech stack chips (top right):**
`FastAPI · Neo4j + GDS · React + Vite · Cytoscape.js · spaCy · rapidfuzz · hashlib (stdlib)`

**Points (right half):**
- **Methodology:** structured sources (CDR/transactions) map deterministically to edges (~70% of relationships); text needs regex-first + gazetteer NER (~30%).
- **KEY technical insight:** project the heterogeneous evidence graph to a **PERSON-PERSON network before computing centrality** — otherwise database artifacts (phones, accounts) outrank criminals.
- **Suspicious-pattern detection:** 7 named heuristics (Hub, Broker, Community, Burst, Fade-Out, New Connection, Star) → each a Cypher query + threshold → combined priority score.
- **Explainability:** "Why Flagged?" panel shows which heuristic fired + the actual source snippet.
- **Prototype UI screenshot** (graph + Why Flagged panel) as the "working prototype" proof.

---

### Slide 4 — FEASIBILITY & VIABILITY (official pointer)

**Pointer required:** "Analysis of feasibility · Potential challenges & risks · Strategies to overcome"

**Visual (left 50%):** challenge → mitigation table:

| Challenge | Mitigation |
|---|---|
| Dissimilar/transliterated Indian names (राहुल ↔ Rahul) | Gazetteers + transliteration normalization + multi-signal scoring |
| Evidence integrity doubted in court | SHA-256 hash-chained custody log + verify button (tamper breaks chain) |
| Large scale (millions of records) | Neo4j scales; person-projection is a standard graph operation |
| LLM summary hallucination | Summarize retrieved facts only; works with LLM switched OFF |

**Points (right 50%):**
- **Feasibility:** fully open-source stack; one `docker-compose up`; no paid services required.
- **Real data already sourced:** POLE crime graph, TransXion financial fraud, CRIMENET criminal-org knowledge graph, real Indian FIR/crime datasets.
- **Buildable in hackathon window:** phase-gated roadmap; walking skeleton by day 2; MVP dataset is small & adversarial (20 persons, 2 planted wrong-merge traps).
- **Scalable & viable:** design targets production LEA workloads; aligns to DPDP Act 2023 (purpose limitation, audit log, human-in-loop).

---

### Slide 5 — IMPACT & BENEFITS (official pointer)

**Pointer required:** "Potential impact on the target audience · Benefits (social, economic, environmental)"

**Visual (left 50%):** 3–4 big quantified numbers in cards:
- **Entity resolution F1 ≈ 0.91** (vs ground-truth pair set)
- **Key entity found in < 2 min** (vs days of manual charting)
- **100% tamper-evident** (1-byte change breaks the custody chain)
- **0 automated adverse decisions** (human-in-the-loop by design)

**Points (right 50%):**
- **Target audience:** NCRB **Women Safety Division** & LEA investigators — trafficking rings, cyberstalking & fraud networks (the owning division).
- **Societal benefit:** faster disruption of fraud/trafficking networks; fewer collapsed cases from untrusted evidence.
- **Economic benefit:** replaces days of manual analyst charting → investigator time savings.
- **Alignment:** Blockchain theme is honored as real evidentiary chain-of-custody (not a token); DPDP 2023 aligned (privacy shipped as a feature).
- **Sibling-PS synergy:** feeds MHA's crypto-attribution (26182), fraud-exchange (26183), cash-withdrawal (26184) workflows as the network-intelligence backbone.

---

### Slide 6 — RESEARCH & REFERENCES (official pointer)

**Pointer required:** "Details / Links of reference and research work"

**Visual/format:** clean citation list, grouped.

**Research grounding:**
- UK NCA **LATIS study (2026)** — real analysts use AI selectively, demand feature-level explanations → our explainability-first design.
- **GraphAware production study** — network projection is the breakthrough step in criminal-network analytics → our Step 2.
- **Tattletale (SIH'24 NIA winner, deployed at NIA)** — deterministic explainable correlation, refusal of false attribution, SHA-256 custody chain → our direct precedent.

**Prior SIH winners we build on:**
- CDR/IPDR Visualizer (SIH'20 BPRD) — multi-format ingest, IMEI↔number linking
- UFDR Analyzer (SIH'25) — NL access to evidence, court-ready reports
- KAVACH (SIH'25) — quantified stage metrics

**Datasets / sources:**
- POLE (Neo4j graph examples, 29K crimes)
- TransXion (3M financial transactions)
- CRIMENET (4,504 criminal orgs knowledge graph)
- NCRB Crime-in-India statistical data

---

## 6. Notes for the internal college pitch (not this deck)

This 6-slide deck is the **portal/national-screening** deliverable. The internal college PPT (Sept 1) is a separate live pitch with its own 8-slide structure (already in `2026-08-27-internal-hackathon-plan.md`). Reuse this deck's diagrams, numbers and REFUSE-card story for both.

## 7. Open items before submission (Sept 20)

1. Fill in **Team ID / Team Name** from the SIH portal (needed on Slide 1).
2. Capture **real prototype UI screenshots** (graph + Why Flagged + refuse card) for Slides 3/5.
3. Ground the **F1 number** on the actual scored MVP run (replace ~0.91 placeholder with measured value).
4. Build the deck file from the SIH official template, keep section pointers, export to **PDF**, keep **< 10MB**.
5. Dry-run the deck against the 2–3 min scan: does the story complete without narration?
