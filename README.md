# Red-String

**AI-Powered Criminal Network Analysis System**

> SIH 2026 · PS-26189 · Ministry of Home Affairs · NCRB Women Safety Division

---

## The Problem

Law enforcement agencies collect data from multiple sources — CDRs, FIRs, bank transactions, vehicle records — but each lives in a separate silo. Analysts spend **days** manually charting connections on Excel sheets. The same person appears as "Rahul Sharma" in one database, "R. Sharma" in another, and "Rahul S." in a third. False identity links collapse cases. There is no explainability, no audit trail, and no way to see the network.

**5.3 million FIRs** were registered in India in 2023. The data exists. The connections are hidden.

---

## What Red-String Does

Red-String takes fragmented crime data from multiple LEA sources and builds a **time-aware criminal intelligence knowledge graph**. It resolves identities across databases, maps hidden relationships, ranks key individuals, and provides cryptographically verifiable audit trails — all with explainable decisions, not black-box AI.

```
┌──────────┐    ┌───────────┐    ┌──────────┐    ┌───────┐    ┌────────┐
│  INGEST  │ →  │ RESOLVE ★ │ →  │ NETWORK  │ ←  │ TRUST │ →  │ REPORT │
│ xlsx/csv │    │ merge /   │    │ person-  │    │ hash  │    │ court- │
│ json/txt │    │ refuse /  │    │ person   │    │ chain │    │ ready  │
│ + text   │    │ review    │    │ graph    │    │ log   │    │ PDF    │
└──────────┘    └───────────┘    └──────────┘    └───────┘    └────────┘
```

---

## Key Features

| Feature | What It Does |
|---|---|
| **Multi-format Ingestion** | Reads .xlsx / .csv / .json / .txt — the formats LEAs actually hold |
| **Entity Resolution with Refusal** | Resolves "Rahul Sharma" / "R. Sharma" / "Rahul S." across sources. **Refuses** false matches with reasons shown. |
| **Person-Person Projection** | Projects heterogeneous graph to person-to-person before running centrality — avoids inflated scores from phone/account nodes |
| **7 Suspicious-Pattern Heuristics** | Named, queryable detection: Hub, Broker, Community, Burst, Fade-Out, New Connection, Star |
| **Why-Flagged Panel** | Every high-priority entity shows exactly WHY it's flagged — with evidence math and source records |
| **SHA-256 Custody Chain** | Every action (ingest, merge, view) is hash-chained. Tamper one byte — chain breaks. Verify button in UI. |
| **Court-Ready PDF** | One-click report: entity profile, evidence snippets, timeline, financial flows, hash manifest |

---

## How It Works

### 1. INGEST

Reads raw files from LEA databases. Extracts entities using regex rules first (phones, vehicles, accounts — near-100% precision), NER second (names, locations — gazetteer-backed for Indian names). Normalizes to one schema.

### 2. RESOLVE ★

Multi-signal scoring across every entity pair:

```
Name similarity        0.92
Phone match            1.00
Vehicle match          1.00
Location similarity    0.87
───────────────────────────
Match Confidence       0.96  →  MERGE card
```

Three outputs: **MERGE** (evidence shown, reversible), **REFUSE** (same name, different person), **REVIEW** (human decides).

### 3. NETWORK

Projects to person-to-person graph. Runs centrality + community detection. Seven named heuristics produce a priority score (0–10) per entity.

### 4. TRUST

Append-only SHA-256 hash chain. Every action logged. Verify button recomputes the chain live on stage.

### 5. REPORT

One click generates court-ready PDF with entity profile, evidence snippets, timeline, financial flows, and hash manifest.

---

## Suspicious-Pattern Heuristics

Seven named heuristics, each a Cypher query with threshold on the person-projection graph:

| # | Heuristic | Catches | Threshold |
|---|---|---|---|
| 1 | **Hub Detection** | Person with unusually many contacts | degree > 2× network average |
| 2 | **Broker Detection** | Person bridging two disconnected groups | betweenness top 10% |
| 3 | **Community Detection** | Criminal ring membership | Louvain, community size ≥ 3 |
| 4 | **Burst Detection** | Sudden communication spike before event | 48h volume > 3× 7-day average |
| 5 | **Fade-Out Detection** | Person goes quiet before crime | activity drop >80% in 14 days |
| 6 | **New Connection** | Two people linked shortly before crime | first_seen < 30 days before FIR |
| 7 | **Star Pattern** | One person controlling many, no lateral links | degree ≥ 5, clustering < 0.3 |

**Score aggregation:**

```
priority = (0.25×HUB + 0.25×BROKER + 0.15×BURST + 0.15×NEW_CONNECTION
            + 0.10×STAR + 0.05×FADEOUT + 0.05×COMMUNITY) × 10
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Graph Visualization | Cytoscape.js |
| Backend | Python + FastAPI + Pydantic |
| Graph Database | Neo4j + GDS Plugin |
| AI/NLP | spaCy + rapidfuzz + custom gazetteers |
| Trust Layer | hashlib (SHA-256, stdlib) |
| Reports | WeasyPrint |
| Deployment | Docker Compose |
| Optional LLM | Ollama (Qwen 2.5 / Llama 3.x) — summaries only |

---

## Dataset

### MVP Dataset

```
20 persons · 10 phones · 8 accounts · 5 vehicles · 10 locations
50 transactions · 30 CDR records · 10 FIR/intelligence texts
```

Includes: legitimate clusters, noise, duplicate names, transliteration variants, missing records, temporal changes, false associations, and **2 planted wrong-merge traps** for the REFUSE demo.

### Real Data Sources

| Source | What We Use |
|---|---|
| Karnataka FIR Dataset (Kaggle) | 1.6M real Indian FIRs — schema reference |
| FraudZen CDR (Zenodo) | Real CDR format — caller, callee, tower, duration |
| TransXion | 3M financial transactions — laundering labels |
| POLE (Neo4j) | 61K nodes, 106K relationships — primary demo graph |
| NCRB Crime-in-India | Official statistics — pitch credibility |
| VAHAN/Parivahan | Indian vehicle registration — schema reference |

---

---

## Problem Statement

| Field | Value |
|---|---|
| PS ID | SIH26189 |
| Title | AI-Powered Criminal Network Analysis System |
| Organization | Ministry of Home Affairs |
| Department | NCRB — Women Safety Division |
| Theme | Blockchain & Cybersecurity |
| Category | Software |

---

## Compliance

- Aligned with **DPDP Act, 2023** — purpose limitation, minimum-necessary fields
- Every action logged in append-only audit chain
- Human-in-the-loop is structural — no adverse action fires automatically
- **We do NOT decide who is criminal.** We surface evidence for investigators.

---

## License

MIT
