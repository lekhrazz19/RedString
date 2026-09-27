/**
 * red.string — typed contracts.
 * Mirrors the 5 team interfaces (RecordSchema, EntityId, GraphSchema+scores,
 * AuditEvent, ReportPayload) so a real FastAPI backend can drop in later.
 */

export type EntityType =
  | 'PERSON'
  | 'PHONE'
  | 'ACCOUNT'
  | 'VEHICLE'
  | 'LOCATION'
  | 'ORGANIZATION'
  | 'CASE'

export type EdgeType =
  | 'ASSOCIATED_WITH' // person-projection edge
  | 'CALLED'
  | 'TRANSFERRED_TO'
  | 'OWNS'
  | 'LOCATED_AT'
  | 'MET'
  | 'MENTIONED_IN'
  | 'SAME_AS' // confirmed identity merge — canonical ↔ alias

export type HeuristicKey =
  | 'HUB'
  | 'BROKER'
  | 'COMMUNITY'
  | 'BURST'
  | 'FADEOUT'
  | 'NEW_CONNECTION'
  | 'STAR'

export interface GraphNode {
  id: string
  type: EntityType
  label: string
  aliases?: string[]
  /** community id — persons only */
  community?: number
  /** 0–10 investigative ranking score — persons only */
  priority_score?: number
  /** which heuristics fired (1) or not (0) — persons only */
  sub_scores?: Partial<Record<HeuristicKey, number>>
  fired_heuristics?: HeuristicKey[]
  degree?: number
  rank?: number
  meta?: Record<string, string | number>
  evidence_ids?: string[]
  /** true when added during a live ingest in this session */
  ingested?: boolean
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: EdgeType
  weight: number
  event_count: number
  first_seen: string
  last_seen: string
  total_amount?: number
  total_duration_min?: number
  suspicious?: boolean
  evidence_ids: string[]
  ingested?: boolean
}

export interface GraphSchema {
  case_id: string
  case_title: string
  generated: string
  nodes: GraphNode[]
  edges: GraphEdge[]
}

/* ---------- RESOLVE ---------- */

export type ResolveDecision = 'MERGE' | 'REFUSE' | 'REVIEW'

/** the outcome an investigator recorded against a resolve card */
export type ResolveOutcome =
  | 'merge_confirmed'
  | 'merge_held'
  | 'refuse_upheld'
  | 'review_accepted'
  | 'review_rejected'

export interface ResolveSignal {
  label: string
  value: number // 0–1
  weight: number // contribution weight, sums ~1 across signals
  note?: string
}

export interface ResolveSide {
  id: string
  label: string
  source: string // e.g. "FIR1024", "HDFC bank dump", "SURV-0912"
  descriptor: string // one-line behavioural summary
}

export interface ResolveCard {
  id: string
  decision: ResolveDecision
  left: ResolveSide
  right: ResolveSide
  signals: ResolveSignal[]
  match_confidence: number // weighted sum, 0–1
  merge_threshold: number
  review_band: [number, number] // [low, high] → REVIEW between these
  rationale: string
  is_trap?: boolean
  discriminators?: string[] // REFUSE: the signals that keep them apart
  evidence_ids: string[]
}

export interface ResolveCards {
  merge: ResolveCard[]
  refuse: ResolveCard[]
  review: ResolveCard[]
}

/* ---------- EVIDENCE ---------- */

export type EvidenceSource =
  | 'FIR'
  | 'CDR'
  | 'TXN'
  | 'SURVEILLANCE'
  | 'VEHICLE'
  | 'INTEL'

export interface EvidenceRecord {
  id: string // "FIR-1024"
  source_type: EvidenceSource
  title: string
  verbatim_text: string
  fields: Record<string, string | number>
  timestamp: string
  entities: string[] // node ids referenced
}

/* ---------- TRUST / custody ---------- */

export type AuditAction =
  | 'INGEST'
  | 'RESOLVE_MERGE'
  | 'RESOLVE_REFUSE'
  | 'RESOLVE_REVIEW'
  | 'VIEW_ENTITY'
  | 'RUN_HEURISTICS'
  | 'REPORT_GENERATE'
  | 'VERIFY_CHAIN'

export interface AuditEvent {
  seq: number
  action: AuditAction
  actor: string
  target: string
  artifact_hash: string
  timestamp: string
  /** SHA-256(prev_entry_hash ‖ artifact_hash ‖ action ‖ actor ‖ timestamp) — filled by hash/chain.ts */
  entry_hash?: string
}

export interface ChainVerification {
  ok: boolean
  brokenAt: number | null
  root: string
  checked: number
}

/* ---------- REPORT ---------- */

export interface ReportRelationship {
  entity: string
  relation: string
  strength: number
  suspicious: boolean
  community?: number
  evidence_ids: string[]
}

export interface ReportCounts {
  connections: number
  communities: number
  financial: number
  communication: number
  locations: number
}

export interface ReportPayload {
  generated: string
  case_id: string
  actor: string
  subject: GraphNode
  ranking_score: number
  counts: ReportCounts
  fired_heuristics: {
    key: HeuristicKey
    label: string
    catches: string
    threshold: string
    weight: number
    evidence_ids: string[]
  }[]
  relationships: ReportRelationship[]
  timeline: { timestamp: string; label: string; evidence_id?: string }[]
  financial_flows: {
    from: string
    to: string
    amount: number
    channel: string
    when: string
    evidence_id: string
  }[]
  evidence: EvidenceRecord[]
  custody_root: string
  hash_manifest: { artifact: string; hash: string }[]
}
