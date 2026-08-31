import Papa from 'papaparse'
import type { EntityType, GraphEdge, GraphNode } from '@/lib/api/types'
import { BASE_GRAPH } from '@/lib/fixtures/dataset'

export interface Extraction {
  key: string
  value: string
  type: EntityType | 'DATE'
  method: 'regex' | 'ner' | 'date-parser'
  confidence: number
}

export interface ParsedIngest {
  kind: 'CDR' | 'TXN' | 'UNKNOWN'
  sourceLabel: string
  rowCount: number
  extractions: Extraction[]
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export const CONFIDENCE_THRESHOLD = 0.6

const PHONE_RE = /^\+?\d[\d ]{8,}$/
const IMEI_RE = /^\d{2}-\d{6}-\d{6}-\d$/

/* map known person / account labels back to their canonical fixture ids */
const NAME_TO_ID = new Map<string, string>()
for (const n of BASE_GRAPH.nodes) {
  NAME_TO_ID.set(n.label.toLowerCase(), n.id)
  for (const a of n.aliases ?? []) NAME_TO_ID.set(a.toLowerCase(), n.id)
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}
function personId(name: string): string {
  return NAME_TO_ID.get(name.toLowerCase()) ?? `p_ing_${slug(name)}`
}
function phoneId(num: string): string {
  return `ph_ing_${slug(num)}`
}
function accountId(acc: string): string {
  return NAME_TO_ID.get(acc.toLowerCase()) ?? `ac_ing_${slug(acc)}`
}

export function parseCsv(text: string, fileName: string): ParsedIngest {
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })
  const rows = data.filter((r) => Object.keys(r).length > 1)
  const headers = rows.length ? Object.keys(rows[0]) : []

  if (headers.includes('caller') && headers.includes('callee')) {
    return parseCdr(rows, fileName)
  }
  if (headers.includes('sender_account') && headers.includes('receiver_account')) {
    return parseTxn(rows, fileName)
  }
  return { kind: 'UNKNOWN', sourceLabel: fileName, rowCount: rows.length, extractions: [], nodes: [], edges: [] }
}

/* ------------------------------------------------------------------ CDR */

function parseCdr(rows: Record<string, string>[], fileName: string): ParsedIngest {
  const extractions: Extraction[] = []
  const nodeMap = new Map<string, GraphNode>()
  const pairAgg = new Map<
    string,
    { a: string; b: string; count: number; dur: number; first: string; last: string; imei: string }
  >()

  rows.forEach((r, i) => {
    const callerName = r.caller_name?.trim() || r.caller?.trim() || `Unknown ${i}`
    const calleeName = r.callee_name?.trim() || r.callee?.trim() || `Unknown ${i}`
    const ts = (r.timestamp ?? '').slice(0, 10) || '2026-03-01'
    const dur = Number(r.duration_s ?? 0)
    const imei = r.imei?.trim() ?? ''

    extractions.push(ex(`r${i}-caller`, callerName, 'PERSON', 'ner', 0.72))
    extractions.push(ex(`r${i}-callee`, calleeName, 'PERSON', 'ner', 0.72))
    if (r.caller && PHONE_RE.test(r.caller.trim()))
      extractions.push(ex(`r${i}-cph`, r.caller.trim(), 'PHONE', 'regex', 0.97))
    if (r.callee && PHONE_RE.test(r.callee.trim()))
      extractions.push(ex(`r${i}-eph`, r.callee.trim(), 'PHONE', 'regex', 0.97))
    if (imei && IMEI_RE.test(imei)) extractions.push(ex(`r${i}-imei`, imei, 'PHONE', 'regex', 0.98))
    if (r.cell_tower) extractions.push(ex(`r${i}-loc`, r.cell_tower.trim(), 'LOCATION', 'ner', 0.55))
    if (r.timestamp) extractions.push(ex(`r${i}-ts`, ts, 'DATE', 'date-parser', 0.99))

    const pa = personId(callerName)
    const pb = personId(calleeName)
    ensurePerson(nodeMap, pa, callerName)
    ensurePerson(nodeMap, pb, calleeName)
    if (r.caller && PHONE_RE.test(r.caller.trim())) {
      const id = phoneId(r.caller.trim())
      nodeMap.set(id, { id, type: 'PHONE', label: r.caller.trim(), meta: { owner: pa, imei }, ingested: true })
    }
    if (r.callee && PHONE_RE.test(r.callee.trim())) {
      const id = phoneId(r.callee.trim())
      nodeMap.set(id, { id, type: 'PHONE', label: r.callee.trim(), meta: { owner: pb } })
    }

    const [x, y] = [pa, pb].sort()
    const key = `${x}|${y}`
    const agg = pairAgg.get(key) ?? { a: x, b: y, count: 0, dur: 0, first: ts, last: ts, imei }
    agg.count += 1
    agg.dur += dur
    agg.first = ts < agg.first ? ts : agg.first
    agg.last = ts > agg.last ? ts : agg.last
    pairAgg.set(key, agg)
  })

  const edges: GraphEdge[] = []
  let seq = 0
  for (const agg of pairAgg.values()) {
    const w = Math.min(0.9, 0.3 + agg.count * 0.12)
    edges.push(edge(`ing_call_${seq}`, agg.a, agg.b, 'CALLED', {
      weight: w,
      event_count: agg.count,
      total_duration_min: Math.round(agg.dur / 60),
      first_seen: agg.first,
      last_seen: agg.last,
    }))
    edges.push(edge(`ing_assoc_${seq}`, agg.a, agg.b, 'ASSOCIATED_WITH', {
      weight: w,
      event_count: agg.count,
      first_seen: agg.first,
      last_seen: agg.last,
    }))
    seq += 1
  }
  for (const [id, n] of nodeMap) {
    if (n.type === 'PHONE') edges.push(edge(`ing_owns_${id}`, String(n.meta?.owner), id, 'OWNS', { weight: 1 }))
  }

  return {
    kind: 'CDR',
    sourceLabel: fileName,
    rowCount: rows.length,
    extractions,
    nodes: [...nodeMap.values()],
    edges,
  }
}

/* ------------------------------------------------------------------ TXN */

function parseTxn(rows: Record<string, string>[], fileName: string): ParsedIngest {
  const extractions: Extraction[] = []
  const nodeMap = new Map<string, GraphNode>()
  const pairAgg = new Map<
    string,
    { from: string; to: string; count: number; amount: number; first: string; last: string }
  >()

  rows.forEach((r, i) => {
    const senderName = r.sender_name?.trim() || r.sender_account?.trim() || `Unknown ${i}`
    const receiverName = r.receiver_name?.trim() || r.receiver_account?.trim() || `Unknown ${i}`
    const ts = (r.timestamp ?? '').slice(0, 10) || '2026-03-01'
    const amount = Number(r.amount ?? 0)

    extractions.push(ex(`r${i}-sn`, senderName, 'PERSON', 'ner', 0.72))
    extractions.push(ex(`r${i}-rn`, receiverName, 'PERSON', 'ner', 0.72))
    if (r.sender_account) extractions.push(ex(`r${i}-sa`, r.sender_account.trim(), 'ACCOUNT', 'regex', 0.95))
    if (r.receiver_account) extractions.push(ex(`r${i}-ra`, r.receiver_account.trim(), 'ACCOUNT', 'regex', 0.95))
    if (r.timestamp) extractions.push(ex(`r${i}-ts`, ts, 'DATE', 'date-parser', 0.99))

    const pf = personId(senderName)
    const pt = personId(receiverName)
    ensurePerson(nodeMap, pf, senderName)
    ensurePerson(nodeMap, pt, receiverName)
    if (r.sender_account) {
      const id = accountId(r.sender_account.trim())
      if (!id.startsWith('ac_ing')) {
        /* existing */
      } else nodeMap.set(id, { id, type: 'ACCOUNT', label: r.sender_account.trim(), meta: { owner: pf }, ingested: true })
    }
    if (r.receiver_account) {
      const id = accountId(r.receiver_account.trim())
      if (id.startsWith('ac_ing'))
        nodeMap.set(id, { id, type: 'ACCOUNT', label: r.receiver_account.trim(), meta: { owner: pt }, ingested: true })
    }

    const key = `${pf}|${pt}`
    const agg = pairAgg.get(key) ?? { from: pf, to: pt, count: 0, amount: 0, first: ts, last: ts }
    agg.count += 1
    agg.amount += amount
    agg.first = ts < agg.first ? ts : agg.first
    agg.last = ts > agg.last ? ts : agg.last
    pairAgg.set(key, agg)
  })

  const edges: GraphEdge[] = []
  let seq = 0
  for (const agg of pairAgg.values()) {
    const w = Math.min(0.9, 0.35 + agg.count * 0.15)
    edges.push(edge(`ing_txn_${seq}`, agg.from, agg.to, 'TRANSFERRED_TO', {
      weight: w,
      event_count: agg.count,
      total_amount: agg.amount,
      first_seen: agg.first,
      last_seen: agg.last,
      suspicious: agg.amount > 250000,
    }))
    edges.push(edge(`ing_txn_assoc_${seq}`, agg.from, agg.to, 'ASSOCIATED_WITH', {
      weight: w,
      event_count: agg.count,
      first_seen: agg.first,
      last_seen: agg.last,
    }))
    seq += 1
  }

  return {
    kind: 'TXN',
    sourceLabel: fileName,
    rowCount: rows.length,
    extractions,
    nodes: [...nodeMap.values()],
    edges,
  }
}

/* --------------------------------------------------------------- helpers */

function ex(
  key: string,
  value: string,
  type: Extraction['type'],
  method: Extraction['method'],
  confidence: number,
): Extraction {
  return { key, value, type, method, confidence }
}

function ensurePerson(map: Map<string, GraphNode>, id: string, label: string) {
  if (id.startsWith('p_ing_') && !map.has(id)) {
    map.set(id, {
      id,
      type: 'PERSON',
      label,
      community: 2,
      priority_score: 0,
      fired_heuristics: [],
      ingested: true,
      meta: { role: 'Added via live ingest — not yet scored' },
    })
  }
}

function edge(
  id: string,
  source: string,
  target: string,
  type: GraphEdge['type'],
  opts: Partial<GraphEdge>,
): GraphEdge {
  return {
    id,
    source,
    target,
    type,
    weight: opts.weight ?? 0.5,
    event_count: opts.event_count ?? 1,
    first_seen: opts.first_seen ?? '2026-03-01',
    last_seen: opts.last_seen ?? '2026-03-01',
    total_amount: opts.total_amount,
    total_duration_min: opts.total_duration_min,
    suspicious: opts.suspicious,
    evidence_ids: [],
    ingested: true,
  }
}
