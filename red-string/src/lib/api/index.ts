/**
 * Mock API — static fixtures behind a typed, async, latency-simulating layer
 * shaped like the future FastAPI contract. No backend process.
 *
 * A real FastAPI service can replace this module without touching callers.
 */
import { buildChain, sha256, verifyChain } from '@/lib/hash/chain'
import { sleep } from '@/lib/utils'
import {
  AUDIT_SEED,
  BASE_GRAPH,
  EVIDENCE,
  HEURISTIC_META,
  HEURISTIC_WEIGHTS,
  RESOLVE_CARDS,
} from '@/lib/fixtures/dataset'
import type {
  AuditAction,
  AuditEvent,
  ChainVerification,
  EvidenceRecord,
  GraphEdge,
  GraphNode,
  GraphSchema,
  HeuristicKey,
  ReportPayload,
  ResolveCards,
  ResolveOutcome,
} from './types'

const LATENCY = 140

function clone<T>(v: T): T {
  return structuredClone(v)
}

interface Db {
  graph: GraphSchema
  audit: Omit<AuditEvent, 'entry_hash'>[]
  /** an out-of-band tampered copy for the verify-chain demo; null = clean */
  tamperedAudit: AuditEvent[] | null
  /** investigator decisions on resolve cards, keyed by card id */
  resolveDecisions: Record<string, ResolveOutcome>
}

let db: Db = seed()

function seed(): Db {
  return {
    graph: clone(BASE_GRAPH),
    audit: AUDIT_SEED.map((s, i) => ({
      seq: i + 1,
      action: s.action,
      actor: s.actor,
      target: s.target,
      timestamp: s.timestamp,
      artifact_hash: '', // filled by fillSeedHashes()
    })),
    tamperedAudit: null,
    resolveDecisions: {},
  }
}

async function fillSeedHashes(target: Db): Promise<void> {
  for (const e of target.audit) {
    if (!e.artifact_hash) {
      e.artifact_hash = await sha256(`${e.action}:${e.target}:${e.timestamp}`)
    }
  }
}

let ready: Promise<void> = fillSeedHashes(db)

/* --------------------------------------------------------------- graph */

export async function getGraph(): Promise<GraphSchema> {
  await sleep(LATENCY)
  return clone(db.graph)
}

export function degreeOf(graph: GraphSchema, id: string, projectionOnly = true): number {
  const seen = new Set<string>()
  for (const e of graph.edges) {
    if (projectionOnly && e.type !== 'ASSOCIATED_WITH') continue
    if (e.source === id) seen.add(e.target)
    else if (e.target === id) seen.add(e.source)
  }
  return seen.size
}

export interface EntityDetail {
  node: GraphNode
  neighbours: { node: GraphNode; edge: GraphEdge }[]
  counts: {
    connections: number
    communities: number
    financial: number
    communication: number
    locations: number
  }
  fired: { key: HeuristicKey; label: string; catches: string; threshold: string }[]
  evidence: EvidenceRecord[]
}

export async function getEntity(id: string): Promise<EntityDetail> {
  await sleep(LATENCY)
  const g = db.graph
  const node = g.nodes.find((n) => n.id === id)
  if (!node) throw new Error(`unknown entity ${id}`)

  const nodeById = new Map(g.nodes.map((n) => [n.id, n]))
  const assoc = g.edges.filter(
    (e) => e.type === 'ASSOCIATED_WITH' && (e.source === id || e.target === id),
  )
  const neighbours = assoc
    .map((e) => {
      const otherId = e.source === id ? e.target : e.source
      const other = nodeById.get(otherId)
      return other ? { node: other, edge: e } : null
    })
    .filter((x): x is { node: GraphNode; edge: GraphEdge } => x !== null)
    .sort((a, b) => b.edge.weight - a.edge.weight)

  const communities = new Set(
    neighbours.map((n) => n.node.community).filter((c): c is number => c !== undefined),
  )
  if (node.community !== undefined) communities.add(node.community)

  const touching = g.edges.filter((e) => e.source === id || e.target === id)
  const financial = touching.filter((e) => e.type === 'TRANSFERRED_TO').length
  const communication = touching.filter((e) => e.type === 'CALLED').length
  const locations = touching.filter((e) => e.type === 'LOCATED_AT').length

  const fired = (node.fired_heuristics ?? []).map((key) => ({
    key,
    label: HEURISTIC_META[key].label,
    catches: HEURISTIC_META[key].catches,
    threshold: HEURISTIC_META[key].threshold,
  }))

  const evidenceIds = new Set<string>(node.evidence_ids ?? [])
  for (const e of touching) e.evidence_ids.forEach((x) => evidenceIds.add(x))
  const evidence = EVIDENCE.filter((r) => evidenceIds.has(r.id))

  return {
    node: clone(node),
    neighbours: clone(neighbours),
    counts: {
      connections: neighbours.length,
      communities: communities.size,
      financial,
      communication,
      locations,
    },
    fired,
    evidence: clone(evidence),
  }
}

/* ------------------------------------------------------------- resolve */

const RESOLVE_OUTCOME_META: Record<ResolveOutcome, { action: AuditAction; verb: string }> = {
  merge_confirmed: { action: 'RESOLVE_MERGE', verb: 'Merge confirmed' },
  merge_held: { action: 'RESOLVE_REVIEW', verb: 'Merge held for review' },
  refuse_upheld: { action: 'RESOLVE_REFUSE', verb: 'Refusal upheld — kept separate' },
  review_accepted: { action: 'RESOLVE_MERGE', verb: 'Match accepted by investigator' },
  review_rejected: { action: 'RESOLVE_REFUSE', verb: 'Match rejected by investigator' },
}

export async function getResolveState(): Promise<{
  cards: ResolveCards
  decisions: Record<string, ResolveOutcome>
}> {
  await sleep(LATENCY)
  return { cards: clone(RESOLVE_CARDS), decisions: clone(db.resolveDecisions) }
}

/** Record a decision. Idempotent: re-selecting the same outcome does not re-log. */
export async function decideResolve(
  cardId: string,
  outcome: ResolveOutcome,
  actor = 'insp.rao@ncrb',
): Promise<void> {
  if (db.resolveDecisions[cardId] === outcome) return
  db.resolveDecisions[cardId] = outcome
  const card = [...RESOLVE_CARDS.merge, ...RESOLVE_CARDS.refuse, ...RESOLVE_CARDS.review].find(
    (c) => c.id === cardId,
  )
  const meta = RESOLVE_OUTCOME_META[outcome]
  await appendAudit({
    action: meta.action,
    actor,
    target: card
      ? `${meta.verb} · ${card.left.label} ↔ ${card.right.label}`
      : `${meta.verb} · ${cardId}`,
  })
}

/* ------------------------------------------------------------ evidence */

export async function listEvidence(): Promise<EvidenceRecord[]> {
  await sleep(LATENCY)
  return clone(EVIDENCE)
}

export async function getEvidence(id: string): Promise<EvidenceRecord | undefined> {
  await sleep(80)
  return clone(EVIDENCE.find((e) => e.id === id))
}

/* --------------------------------------------------------------- trust */

export async function getCustodyLog(): Promise<AuditEvent[]> {
  await ready
  await sleep(LATENCY)
  if (db.tamperedAudit) return clone(db.tamperedAudit)
  return buildChain(db.audit as AuditEvent[])
}

export async function appendAudit(input: {
  action: AuditEvent['action']
  actor: string
  target: string
}): Promise<void> {
  const timestamp = new Date().toISOString()
  const artifact_hash = await sha256(`${input.action}:${input.target}:${timestamp}`)
  db.audit.push({
    seq: db.audit.length + 1,
    action: input.action,
    actor: input.actor,
    target: input.target,
    timestamp,
    artifact_hash,
  })
  db.tamperedAudit = null // any real activity clears a demo tamper
}

export async function verifyCustodyChain(): Promise<ChainVerification> {
  await ready
  await sleep(220)
  const log = db.tamperedAudit ?? (await buildChain(db.audit as AuditEvent[]))
  return verifyChain(log)
}

/** Flip one byte in a copied row — the tamper demo. Returns the seq hit. */
export async function tamperCustodyChain(): Promise<number> {
  await ready
  await sleep(120)
  const clean = await buildChain(db.audit as AuditEvent[])
  const target = Math.min(4, clean.length) // hit an early ingest row
  const idx = clean.findIndex((e) => e.seq === target)
  const row = clean[idx]
  // edit the stored record's content + its artifact hash, but DO NOT re-chain
  // the entry hashes — exactly what a covert after-the-fact edit looks like
  const mutated = row.target.replace(/\d/, (d) => String((Number(d) + 1) % 10))
  clean[idx] = {
    ...row,
    target: mutated,
    artifact_hash: await sha256(`${row.action}:${mutated}:${row.timestamp}`),
  }
  db.tamperedAudit = clean
  return target
}

export async function resetTamper(): Promise<void> {
  db.tamperedAudit = null
}

/* -------------------------------------------------------------- ingest */

export interface IngestResult {
  addedNodes: number
  addedEdges: number
  graph: GraphSchema
}

export async function commitIngest(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sourceLabel: string,
  actor: string,
): Promise<IngestResult> {
  await sleep(200)
  const existing = new Set(db.graph.nodes.map((n) => n.id))
  let addedNodes = 0
  for (const n of nodes) {
    if (!existing.has(n.id)) {
      db.graph.nodes.push({ ...n, ingested: true })
      existing.add(n.id)
      addedNodes += 1
    }
  }
  const existingEdges = new Set(db.graph.edges.map((e) => `${e.source}>${e.target}>${e.type}`))
  let addedEdges = 0
  for (const e of edges) {
    const key = `${e.source}>${e.target}>${e.type}`
    if (!existingEdges.has(key)) {
      db.graph.edges.push({ ...e, ingested: true })
      existingEdges.add(key)
      addedEdges += 1
    }
  }
  await appendAudit({
    action: 'INGEST',
    actor,
    target: `${sourceLabel} · +${addedNodes} entities, +${addedEdges} relationships`,
  })
  return { addedNodes, addedEdges, graph: clone(db.graph) }
}

/* -------------------------------------------------------------- report */

export async function getReportPayload(entityId: string): Promise<ReportPayload> {
  await ready
  await sleep(260)
  const detail = await getEntity(entityId)
  const g = db.graph
  const nodeById = new Map(g.nodes.map((n) => [n.id, n]))
  const evidenceById = new Map(EVIDENCE.map((e) => [e.id, e]))

  const relationships = detail.neighbours.slice(0, 10).map((n) => ({
    entity: n.node.label,
    relation: n.edge.suspicious ? 'suspected coordination' : 'association',
    strength: n.edge.weight,
    suspicious: Boolean(n.edge.suspicious),
    community: n.node.community,
    evidence_ids: n.edge.evidence_ids,
  }))

  const flows = g.edges
    .filter((e) => e.type === 'TRANSFERRED_TO')
    .map((e) => {
      const evId = e.evidence_ids[0] ?? ''
      return {
        from: nodeById.get(e.source)?.label ?? e.source,
        to: nodeById.get(e.target)?.label ?? e.target,
        amount: e.total_amount ?? 0,
        channel: String(evidenceById.get(evId)?.fields.channel ?? '—'),
        when: e.first_seen,
        evidence_id: evId,
      }
    })
    .sort((a, b) => a.when.localeCompare(b.when))

  const timeline = detail.evidence
    .map((ev) => ({ timestamp: ev.timestamp, label: ev.title, evidence_id: ev.id }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  const chain = await buildChain(db.audit as AuditEvent[])
  const hash_manifest = detail.evidence.map((ev) => ({ artifact: ev.id, hash: '' }))
  for (let i = 0; i < hash_manifest.length; i += 1) {
    // hash the record CONTENT, not its id
    hash_manifest[i].hash = await sha256(JSON.stringify(detail.evidence[i]))
  }

  return {
    generated: new Date().toISOString(),
    case_id: g.case_id,
    actor: 'insp.rao@ncrb',
    subject: detail.node,
    ranking_score: detail.node.priority_score ?? 0,
    counts: detail.counts,
    fired_heuristics: detail.fired.map((f) => ({
      key: f.key,
      label: f.label,
      catches: f.catches,
      threshold: f.threshold,
      weight: HEURISTIC_WEIGHTS[f.key],
      evidence_ids: detail.node.evidence_ids ?? [],
    })),
    relationships,
    timeline,
    financial_flows: flows,
    evidence: detail.evidence,
    custody_root: chain.at(-1)?.entry_hash ?? '',
    hash_manifest,
  }
}

/** Log a report generation to the custody chain — call once per subject view. */
export async function logReportGenerated(caseId: string, subjectLabel: string): Promise<void> {
  await appendAudit({
    action: 'REPORT_GENERATE',
    actor: 'insp.rao@ncrb',
    target: `Case ${caseId} · subject ${subjectLabel}`,
  })
}

/* --------------------------------------------------------------- reset */

export async function resetDemo(): Promise<void> {
  await sleep(120)
  db = seed()
  ready = fillSeedHashes(db)
  await ready
}

export { HEURISTIC_META }
