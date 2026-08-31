/**
 * red.string MVP dataset — small, adversarial, honest.
 * Primary scenario: an organized financial-fraud / mule-account network
 * (Bhopal–Indore) threaded through a legitimate business cluster.
 *
 * Analytics (priority_score, community, fired heuristics) are PRE-COMPUTED here.
 * The UI consumes them; it never recomputes analytics.
 */
import type {
  AuditEvent,
  EvidenceRecord,
  GraphEdge,
  GraphNode,
  GraphSchema,
  HeuristicKey,
  ResolveCards,
} from '@/lib/api/types'


/* documented score weights (SIH26189_Team_Analysis.md §8) */
export const HEURISTIC_WEIGHTS: Record<HeuristicKey, number> = {
  HUB: 0.25,
  BROKER: 0.25,
  BURST: 0.15,
  NEW_CONNECTION: 0.15,
  STAR: 0.1,
  FADEOUT: 0.05,
  COMMUNITY: 0.05,
}

export const HEURISTIC_META: Record<
  HeuristicKey,
  { label: string; catches: string; threshold: string }
> = {
  HUB: {
    label: 'Hub Detection',
    catches: 'Person with unusually many direct contacts',
    threshold: 'degree > 2× network average',
  },
  BROKER: {
    label: 'Broker Detection',
    catches: 'Person bridging two groups that do not otherwise talk',
    threshold: 'betweenness centrality in top 10%',
  },
  COMMUNITY: {
    label: 'Community Membership',
    catches: 'Member of a detected ring',
    threshold: 'Louvain community size ≥ 3',
  },
  BURST: {
    label: 'Burst Detection',
    catches: 'Sudden communication spike before an event',
    threshold: '48h volume > 3× 7-day rolling average',
  },
  FADEOUT: {
    label: 'Fade-Out Detection',
    catches: 'Person goes quiet immediately before a crime',
    threshold: 'activity drop > 80% in the 14 days before an FIR',
  },
  NEW_CONNECTION: {
    label: 'New Connection',
    catches: 'Two people linked for the first time shortly before a crime',
    threshold: 'first_seen < 30 days before the FIR',
  },
  STAR: {
    label: 'Star Pattern',
    catches: 'One person controlling many, with no lateral links between them',
    threshold: 'degree ≥ 5 and clustering coefficient < 0.3',
  },
}

export function scoreFromHeuristics(fired: HeuristicKey[]): number {
  const raw = fired.reduce((s, k) => s + HEURISTIC_WEIGHTS[k], 0)
  return Math.round(raw * 10 * 10) / 10
}

/* ------------------------------------------------------------------ persons */

interface PersonSpec {
  id: string
  label: string
  aliases?: string[]
  community: number
  fired: HeuristicKey[]
  role: string
  evidence_ids?: string[]
  meta?: Record<string, string | number>
}

const PERSON_SPECS: PersonSpec[] = [
  {
    id: 'p_rahul',
    label: 'Rahul Sharma',
    aliases: ['R. Sharma', 'राहुल शर्मा', 'Rahul bhai'],
    community: 1,
    fired: ['HUB', 'BROKER', 'BURST', 'STAR', 'COMMUNITY'],
    role: 'Suspected coordinator — controls payout handset, shell-firm account',
    evidence_ids: ['FIR-1024', 'SURV-0912', 'INTEL-77', 'CDR-2050', 'VEH-4410'],
  },
  {
    id: 'p_amit',
    label: 'Amit Khan',
    aliases: ['A. Khan'],
    community: 1,
    fired: ['HUB', 'BROKER', 'BURST', 'COMMUNITY'],
    role: 'Money handler — routes funds from coordinator to mule pool',
    evidence_ids: ['FIR-1024', 'CDR-2031', 'CDR-2050', 'TXN-8890', 'SURV-0912'],
  },
  {
    id: 'p_iqbal',
    label: 'Iqbal Qureshi',
    community: 1,
    fired: ['BROKER', 'NEW_CONNECTION', 'COMMUNITY'],
    role: 'Bridge — introduces recruiters to the core ring',
    evidence_ids: ['FIR-1090', 'CDR-2044'],
  },
  {
    id: 'p_preeti',
    label: 'Preeti Nair',
    community: 1,
    fired: ['BROKER', 'NEW_CONNECTION', 'COMMUNITY'],
    role: 'Recruiter — onboards mule-account holders',
    evidence_ids: ['CDR-2044'],
  },
  {
    id: 'p_kavya',
    label: 'Kavya Reddy',
    community: 1,
    fired: ['NEW_CONNECTION', 'COMMUNITY'],
    role: 'Recruiter associate',
  },
  {
    id: 'p_sunil',
    label: 'Sunil Yadav',
    community: 2,
    fired: ['HUB', 'COMMUNITY'],
    role: 'Mule coordinator — distributes funds to cash-out accounts',
    evidence_ids: ['FIR-1090', 'TXN-8890'],
  },
  {
    id: 'p_manoj',
    label: 'Manoj Tiwari',
    community: 2,
    fired: ['BURST', 'NEW_CONNECTION', 'COMMUNITY'],
    role: 'Cash-out runner — SIM rotated on shared handset',
    evidence_ids: ['CDR-2077', 'INTEL-77'],
  },
  {
    id: 'p_deepak',
    label: 'Deepak Verma',
    community: 2,
    fired: ['COMMUNITY'],
    role: 'Mule-account holder',
  },
  {
    id: 'p_farhan',
    label: 'Farhan Ali',
    community: 2,
    fired: ['COMMUNITY'],
    role: 'Mule-account holder',
  },
  {
    id: 'p_ravi',
    label: 'Ravi Teja',
    community: 2,
    fired: ['COMMUNITY'],
    role: 'Mule-account holder',
  },
  {
    id: 'p_imran',
    label: 'Imran Sheikh',
    community: 2,
    fired: ['COMMUNITY'],
    role: 'Peripheral associate — identity match unresolved (see REVIEW queue)',
  },
  {
    id: 'p_sanjay',
    label: 'Sanjay Gupta',
    community: 4,
    fired: ['COMMUNITY'],
    role: 'Legitimate businessman — appears as a cover contact',
    meta: { note: 'legitimate cluster' },
  },
  {
    id: 'p_neha',
    label: 'Neha Gupta',
    community: 4,
    fired: ['COMMUNITY'],
    role: 'Family — legitimate cluster',
    meta: { note: 'legitimate cluster' },
  },
  {
    id: 'p_vikram',
    label: 'Vikram Gupta',
    community: 4,
    fired: ['COMMUNITY'],
    role: 'Business partner — legitimate cluster',
    meta: { note: 'legitimate cluster' },
  },
  {
    id: 'p_arjun',
    label: 'Arjun Mehta',
    community: 4,
    fired: ['COMMUNITY'],
    role: 'Accountant — legitimate cluster',
    meta: { note: 'legitimate cluster' },
  },
  {
    id: 'p_pooja',
    label: 'Pooja Sharma',
    community: 5,
    fired: [],
    role: 'Unconnected record — noise / no network role',
    meta: { note: 'noise' },
  },
  {
    id: 'p_rahul_trap',
    label: 'Rahul Sharma',
    community: 6,
    fired: [],
    role: 'PGT Mathematics, Govt HS Indore — SAME NAME, different person',
    evidence_ids: ['SURV-0930'],
    meta: { note: 'wrong-merge trap', occupation: 'schoolteacher', city: 'Indore' },
  },
  {
    id: 'p_amit_trap',
    label: 'Amit Khan',
    community: 7,
    fired: [],
    role: 'Auto-parts dealer, Dewas — SAME NAME, different person',
    meta: { note: 'wrong-merge trap', occupation: 'auto-parts dealer', city: 'Dewas' },
  },
  {
    id: 'p_rsharma',
    label: 'R. Sharma',
    community: 1,
    fired: [],
    role: 'Bank-dump identity record — resolves into Rahul Sharma (MERGE)',
    meta: { note: 'alias record', alias_of: 'p_rahul' },
  },
  {
    id: 'p_akhan',
    label: 'A. Khan',
    community: 1,
    fired: [],
    role: 'CDR subscriber record — resolves into Amit Khan (MERGE)',
    meta: { note: 'alias record', alias_of: 'p_amit' },
  },
]

const RANKED = [...PERSON_SPECS]
  .map((s) => ({ id: s.id, score: scoreFromHeuristics(s.fired) }))
  .sort((a, b) => b.score - a.score)

function rankOf(id: string): number {
  return RANKED.findIndex((r) => r.id === id) + 1
}

const personNodes: GraphNode[] = PERSON_SPECS.map((s) => {
  const score = scoreFromHeuristics(s.fired)
  return {
    id: s.id,
    type: 'PERSON',
    label: s.label,
    aliases: s.aliases,
    community: s.community,
    priority_score: score,
    sub_scores: Object.fromEntries(
      (Object.keys(HEURISTIC_WEIGHTS) as HeuristicKey[]).map((k) => [k, s.fired.includes(k) ? 1 : 0]),
    ) as Partial<Record<HeuristicKey, number>>,
    fired_heuristics: s.fired,
    rank: score > 0 ? rankOf(s.id) : undefined,
    evidence_ids: s.evidence_ids,
    meta: { role: s.role, ...s.meta },
  }
})

/* ------------------------------------------------------ non-person entities */

const otherNodes: GraphNode[] = [
  // phones — IMEI pivot: one handset behind ph_rahul_2 / ph_iqbal_1 / ph_manoj_1
  phone('ph_rahul_1', '+91 98260 11241', 'p_rahul', '35-772104-113900-1'),
  phone('ph_rahul_2', '+91 74150 88761', 'p_rahul', '35-991172-887761-3'),
  phone('ph_amit_1', '+91 99931 40233', 'p_amit', '35-664520-771002-4'),
  phone('ph_iqbal_1', '+91 90391 55820', 'p_iqbal', '35-991172-887761-3'),
  phone('ph_sunil_1', '+91 82699 33417', 'p_sunil', '35-118845-220041-7'),
  phone('ph_manoj_1', '+91 76210 90455', 'p_manoj', '35-991172-887761-3'),
  phone('ph_preeti_1', '+91 93025 71188', 'p_preeti', '35-330199-654120-9'),
  phone('ph_deepak_1', '+91 89620 44127', 'p_deepak', '35-540021-889912-2'),
  phone('ph_sanjay_1', '+91 98931 22771', 'p_sanjay', '35-220984-110477-6'),
  phone('ph_pooja_1', '+91 90011 55098', 'p_pooja', '35-778120-336601-5'),
  // accounts — money path ac_rahul → ac_amit → ac_sunil → ac_deepak/ac_farhan
  account('ac_rahul', 'HDFC ****4471', 'p_rahul'),
  account('ac_amit', 'ICICI ****9930', 'p_amit'),
  account('ac_sunil', 'SBI ****1188', 'p_sunil'),
  account('ac_deepak', 'Kotak ****7742', 'p_deepak'),
  account('ac_farhan', 'PNB ****3391', 'p_farhan'),
  account('ac_manoj', 'BOB ****5561', 'p_manoj'),
  account('ac_sanjay', 'Axis ****2019', 'p_sanjay'),
  account('ac_shell', 'HDFC ****8804 · MP Traders', 'org_mptraders'),
  // vehicles
  vehicle('v_mp04', 'MP04 CX 1337', 'p_rahul'),
  vehicle('v_mp09', 'MP09 KL 4520', 'p_amit'),
  vehicle('v_mp07', 'MP07 AB 9981', 'p_sunil'),
  vehicle('v_mp04b', 'MP04 BB 2210', 'p_sanjay'),
  vehicle('v_ka05', 'KA05 MN 7731', 'p_iqbal'),
  // locations
  loc('loc_bhopal_stn', 'Bhopal Railway Station'),
  loc('loc_mpnagar', 'MP Nagar, Bhopal'),
  loc('loc_arera', 'Arera Colony, Bhopal'),
  loc('loc_habibganj', 'Habibganj, Bhopal'),
  loc('loc_bairagarh', 'Bairagarh, Bhopal'),
  loc('loc_indore_rajwada', 'Rajwada, Indore'),
  loc('loc_indore_vijaynagar', 'Vijay Nagar, Indore'),
  loc('loc_ujjain', 'Ujjain'),
  loc('loc_dewas', 'Dewas'),
  loc('loc_itarsi', 'Itarsi Junction'),
  // organization + cases
  { id: 'org_mptraders', type: 'ORGANIZATION', label: 'MP Traders (shell firm)', meta: { note: 'shell firm' } },
  { id: 'case_fir1024', type: 'CASE', label: 'FIR 1024 / 2026', meta: { station: 'MP Nagar PS', section: 'IPC 420, 120B' } },
  { id: 'case_fir1090', type: 'CASE', label: 'FIR 1090 / 2026', meta: { station: 'Vijay Nagar PS', section: 'IPC 420, 66D IT Act' } },
]

function phone(id: string, label: string, owner: string, imei: string): GraphNode {
  return { id, type: 'PHONE', label, meta: { owner, imei } }
}
function account(id: string, label: string, owner: string): GraphNode {
  return { id, type: 'ACCOUNT', label, meta: { owner } }
}
function vehicle(id: string, label: string, owner: string): GraphNode {
  return { id, type: 'VEHICLE', label, meta: { owner } }
}
function loc(id: string, label: string): GraphNode {
  return { id, type: 'LOCATION', label }
}

/* ---------------------------------------------------------------- edges */

let edgeSeq = 0
function edge(
  source: string,
  target: string,
  type: GraphEdge['type'],
  opts: Partial<Omit<GraphEdge, 'id' | 'source' | 'target' | 'type'>> = {},
): GraphEdge {
  edgeSeq += 1
  return {
    id: `e${edgeSeq}`,
    source,
    target,
    type,
    weight: opts.weight ?? 0.5,
    event_count: opts.event_count ?? 1,
    first_seen: opts.first_seen ?? '2026-01-05',
    last_seen: opts.last_seen ?? '2026-03-18',
    total_amount: opts.total_amount,
    total_duration_min: opts.total_duration_min,
    suspicious: opts.suspicious,
    evidence_ids: opts.evidence_ids ?? [],
  }
}

/** person-projection edges — the default graph view */
const projectionEdges: GraphEdge[] = [
  edge('p_rahul', 'p_amit', 'ASSOCIATED_WITH', {
    weight: 0.95, event_count: 145, suspicious: true,
    first_seen: '2025-06-01', last_seen: '2026-03-15',
    evidence_ids: ['CDR-2031', 'CDR-2050', 'SURV-0912', 'TXN-8872'],
  }),
  edge('p_rahul', 'p_iqbal', 'ASSOCIATED_WITH', { weight: 0.8, event_count: 50, suspicious: true, evidence_ids: ['INTEL-77'] }),
  edge('p_rahul', 'p_sunil', 'ASSOCIATED_WITH', { weight: 0.5, event_count: 25 }),
  edge('p_rahul', 'p_manoj', 'ASSOCIATED_WITH', { weight: 0.45, event_count: 45, suspicious: true, evidence_ids: ['INTEL-77', 'CDR-2077'] }),
  edge('p_rahul', 'p_sanjay', 'ASSOCIATED_WITH', { weight: 0.28, event_count: 30, first_seen: '2025-11-01' }),
  edge('p_amit', 'p_iqbal', 'ASSOCIATED_WITH', { weight: 0.7, event_count: 38 }),
  edge('p_amit', 'p_sunil', 'ASSOCIATED_WITH', { weight: 0.78, event_count: 85, suspicious: true, evidence_ids: ['TXN-8890'] }),
  edge('p_amit', 'p_manoj', 'ASSOCIATED_WITH', { weight: 0.6, event_count: 30 }),
  edge('p_iqbal', 'p_preeti', 'ASSOCIATED_WITH', { weight: 0.66, event_count: 28, first_seen: '2025-10-01', suspicious: true, evidence_ids: ['CDR-2044'] }),
  edge('p_iqbal', 'p_sunil', 'ASSOCIATED_WITH', { weight: 0.55, event_count: 22 }),
  edge('p_preeti', 'p_kavya', 'ASSOCIATED_WITH', { weight: 0.72, event_count: 90 }),
  edge('p_preeti', 'p_deepak', 'ASSOCIATED_WITH', { weight: 0.5, event_count: 35, first_seen: '2025-11-10' }),
  edge('p_preeti', 'p_farhan', 'ASSOCIATED_WITH', { weight: 0.5, event_count: 35, first_seen: '2025-11-20' }),
  edge('p_sunil', 'p_deepak', 'ASSOCIATED_WITH', { weight: 0.82, event_count: 45 }),
  edge('p_sunil', 'p_farhan', 'ASSOCIATED_WITH', { weight: 0.76, event_count: 35 }),
  edge('p_sunil', 'p_ravi', 'ASSOCIATED_WITH', { weight: 0.7, event_count: 30 }),
  edge('p_sunil', 'p_imran', 'ASSOCIATED_WITH', { weight: 0.45, event_count: 18 }),
  edge('p_manoj', 'p_ravi', 'ASSOCIATED_WITH', { weight: 0.5, event_count: 45 }),
  edge('p_manoj', 'p_imran', 'ASSOCIATED_WITH', { weight: 0.4, event_count: 25 }),
  edge('p_deepak', 'p_farhan', 'ASSOCIATED_WITH', { weight: 0.4, event_count: 25 }),
  // legit cluster
  edge('p_sanjay', 'p_neha', 'ASSOCIATED_WITH', { weight: 0.9, event_count: 90 }),
  edge('p_sanjay', 'p_vikram', 'ASSOCIATED_WITH', { weight: 0.85, event_count: 75 }),
  edge('p_sanjay', 'p_arjun', 'ASSOCIATED_WITH', { weight: 0.7, event_count: 45 }),
  edge('p_vikram', 'p_arjun', 'ASSOCIATED_WITH', { weight: 0.6, event_count: 38 }),
  edge('p_neha', 'p_vikram', 'ASSOCIATED_WITH', { weight: 0.5, event_count: 25 }),
  edge('p_neha', 'p_pooja', 'ASSOCIATED_WITH', { weight: 0.25, event_count: 6 }),
]

/** structural / heterogeneous edges — shown when projection toggle is off */
const structuralEdges: GraphEdge[] = [
  // ownership
  ...([
    ['p_rahul', 'ph_rahul_1'], ['p_rahul', 'ph_rahul_2'], ['p_rahul', 'ac_rahul'], ['p_rahul', 'v_mp04'],
    ['p_amit', 'ph_amit_1'], ['p_amit', 'ac_amit'], ['p_amit', 'v_mp09'],
    ['p_iqbal', 'ph_iqbal_1'], ['p_iqbal', 'v_ka05'],
    ['p_sunil', 'ph_sunil_1'], ['p_sunil', 'ac_sunil'], ['p_sunil', 'v_mp07'],
    ['p_manoj', 'ph_manoj_1'], ['p_manoj', 'ac_manoj'],
    ['p_preeti', 'ph_preeti_1'], ['p_deepak', 'ph_deepak_1'], ['p_deepak', 'ac_deepak'],
    ['p_farhan', 'ac_farhan'], ['p_sanjay', 'ph_sanjay_1'], ['p_sanjay', 'ac_sanjay'],
    ['p_sanjay', 'v_mp04b'], ['p_pooja', 'ph_pooja_1'],
    ['org_mptraders', 'ac_shell'], ['p_rahul', 'org_mptraders'],
  ] as [string, string][]).map(([a, b]) => edge(a, b, 'OWNS', { weight: 1 })),
  // calls (person ↔ person, aggregated from CDR)
  edge('p_rahul', 'p_amit', 'CALLED', { event_count: 110, total_duration_min: 840, suspicious: true, first_seen: '2025-06-15', last_seen: '2026-03-14', evidence_ids: ['CDR-2031', 'CDR-2050'] }),
  edge('p_rahul', 'p_iqbal', 'CALLED', { event_count: 45, total_duration_min: 96, evidence_ids: ['INTEL-77'] }),
  edge('p_amit', 'p_sunil', 'CALLED', { event_count: 85, total_duration_min: 142 }),
  edge('p_sunil', 'p_deepak', 'CALLED', { event_count: 35, total_duration_min: 61 }),
  edge('p_sunil', 'p_farhan', 'CALLED', { event_count: 30, total_duration_min: 44 }),
  edge('p_manoj', 'p_ravi', 'CALLED', { event_count: 25, total_duration_min: 25 }),
  edge('p_iqbal', 'p_preeti', 'CALLED', { event_count: 28, total_duration_min: 52, first_seen: '2025-10-01', suspicious: true, evidence_ids: ['CDR-2044'] }),
  edge('p_preeti', 'p_kavya', 'CALLED', { event_count: 90, total_duration_min: 70 }),
  // transfers (person ↔ person, aggregated from TXN)
  edge('p_rahul', 'p_amit', 'TRANSFERRED_TO', { event_count: 18, total_amount: 1800000, suspicious: true, first_seen: '2025-07-20', last_seen: '2026-02-20', evidence_ids: ['TXN-8872', 'TXN-8901'] }),
  edge('p_amit', 'p_sunil', 'TRANSFERRED_TO', { event_count: 35, total_amount: 1250000, suspicious: true, first_seen: '2025-08-10', last_seen: '2026-03-06', evidence_ids: ['TXN-8890'] }),
  edge('p_amit', 'org_mptraders', 'TRANSFERRED_TO', { event_count: 30, total_amount: 600000, suspicious: true, evidence_ids: ['TXN-8901'] }),
  edge('org_mptraders', 'p_rahul', 'TRANSFERRED_TO', { event_count: 6, total_amount: 450000, suspicious: true, first_seen: '2025-10-15', evidence_ids: ['TXN-8901'] }),
  edge('p_sunil', 'p_deepak', 'TRANSFERRED_TO', { event_count: 25, total_amount: 320000, first_seen: '2025-09-01' }),
  edge('p_sunil', 'p_farhan', 'TRANSFERRED_TO', { event_count: 30, total_amount: 280000, first_seen: '2025-09-15' }),
  // located-at
  edge('p_rahul', 'loc_bhopal_stn', 'LOCATED_AT', { first_seen: '2026-05-14', last_seen: '2026-05-14', evidence_ids: ['FIR-1024'] }),
  edge('p_amit', 'loc_bhopal_stn', 'LOCATED_AT', { first_seen: '2026-05-14', last_seen: '2026-05-14', evidence_ids: ['FIR-1024'] }),
  edge('p_rahul', 'loc_arera', 'LOCATED_AT', { evidence_ids: ['VEH-4410'] }),
  edge('p_amit', 'loc_mpnagar', 'LOCATED_AT', { evidence_ids: ['SURV-0912'] }),
  edge('p_iqbal', 'loc_indore_rajwada', 'LOCATED_AT', {}),
  edge('p_preeti', 'loc_indore_vijaynagar', 'LOCATED_AT', {}),
  edge('p_sunil', 'loc_habibganj', 'LOCATED_AT', {}),
  edge('p_rahul_trap', 'loc_indore_rajwada', 'LOCATED_AT', { evidence_ids: ['SURV-0930'] }),
  // met
  edge('p_rahul', 'p_amit', 'MET', { first_seen: '2026-05-14', last_seen: '2026-05-14', evidence_ids: ['FIR-1024', 'SURV-0912'], suspicious: true }),
  // mentioned-in
  edge('p_rahul', 'case_fir1024', 'MENTIONED_IN', { evidence_ids: ['FIR-1024'] }),
  edge('p_amit', 'case_fir1024', 'MENTIONED_IN', { evidence_ids: ['FIR-1024'] }),
  edge('p_iqbal', 'case_fir1090', 'MENTIONED_IN', { evidence_ids: ['FIR-1090'] }),
  edge('p_sunil', 'case_fir1090', 'MENTIONED_IN', { evidence_ids: ['FIR-1090'] }),
  // confirmed identity merges
  edge('p_rahul', 'p_rsharma', 'SAME_AS', { weight: 0.93, evidence_ids: ['TXN-8872', 'VEH-4410'] }),
  edge('p_amit', 'p_akhan', 'SAME_AS', { weight: 0.88, evidence_ids: ['CDR-2031'] }),
]

export const BASE_GRAPH: GraphSchema = {
  case_id: 'FIR1024',
  case_title: 'Organized mule-account fraud network — Bhopal / Indore',
  generated: '2026-05-20T09:12:00+05:30',
  nodes: [...personNodes, ...otherNodes],
  edges: [...projectionEdges, ...structuralEdges],
}

/* -------------------------------------------------------------- evidence */

export const EVIDENCE: EvidenceRecord[] = [
  {
    id: 'FIR-1024',
    source_type: 'FIR',
    title: 'FIR 1024/2026 — MP Nagar PS',
    verbatim_text:
      'On 14.05.2026 at about 16:30 hrs, complainant reported that one Rahul Sharma was seen meeting Amit Khan near the auto-stand outside Bhopal Railway Station. Both left together in a white sedan bearing registration MP04 CX 1337. Complainant states Rahul Sharma had earlier collected cash from multiple persons on the pretext of doubling investments through a firm called MP Traders.',
    fields: { case_id: 'FIR1024', date: '2026-05-14', location: 'Bhopal Railway Station', sections: 'IPC 420, 120B', io: 'SI R. Rao' },
    timestamp: '2026-05-14T16:30:00+05:30',
    entities: ['p_rahul', 'p_amit', 'v_mp04', 'org_mptraders', 'loc_bhopal_stn'],
  },
  {
    id: 'FIR-1090',
    source_type: 'FIR',
    title: 'FIR 1090/2026 — Vijay Nagar PS',
    verbatim_text:
      'Complainant deposited Rs 2,00,000 into an account provided by one Iqbal Qureshi for a promised job placement. Amount was immediately transferred onward. Account holder identified as Sunil Yadav, resident of Habibganj, who denies knowledge of the transaction.',
    fields: { case_id: 'FIR1090', date: '2026-05-19', location: 'Vijay Nagar, Indore', sections: 'IPC 420, 66D IT Act', io: 'SI P. Menon' },
    timestamp: '2026-05-19T11:05:00+05:30',
    entities: ['p_iqbal', 'p_sunil', 'loc_habibganj'],
  },
  {
    id: 'CDR-2031',
    source_type: 'CDR',
    title: 'CDR extract — 74150 88761 → 99931 40233',
    verbatim_text:
      '2026-02-11 16:31:04 | CALL OUT | +91 74150 88761 → +91 99931 40233 | duration 512s | cell MP-BHO-014 (MP Nagar) | IMEI 35-991172-887761-3 | IMSI 405-861-xxxxxxx',
    fields: { caller: '+91 74150 88761', callee: '+91 99931 40233', duration_s: 512, tower: 'MP-BHO-014', imei: '35-991172-887761-3', date: '2026-02-11' },
    timestamp: '2026-02-11T16:31:04+05:30',
    entities: ['ph_rahul_2', 'ph_amit_1', 'p_rahul', 'p_amit'],
  },
  {
    id: 'CDR-2044',
    source_type: 'CDR',
    title: 'CDR extract — 90391 55820 → 93025 71188',
    verbatim_text:
      '2026-02-18 20:14:39 | CALL OUT | +91 90391 55820 → +91 93025 71188 | duration 233s | cell MP-IND-032 (Vijay Nagar) | IMEI 35-330199-654120-9 | first contact between these numbers.',
    fields: { caller: '+91 90391 55820', callee: '+91 93025 71188', duration_s: 233, tower: 'MP-IND-032', date: '2026-02-18', note: 'first observed contact' },
    timestamp: '2026-02-18T20:14:39+05:30',
    entities: ['ph_iqbal_1', 'ph_preeti_1', 'p_iqbal', 'p_preeti'],
  },
  {
    id: 'CDR-2050',
    source_type: 'CDR',
    title: 'CDR burst summary — 74150 88761 ↔ 99931 40233',
    verbatim_text:
      'Aggregated: 14 calls exchanged between +91 74150 88761 and +91 99931 40233 in the 48 hours preceding 2026-02-13, against a 7-day rolling average of 1.7 calls/day. Longest call 41 min. Pattern consistent with a coordination burst before an event.',
    fields: { window: '48h to 2026-02-13', call_count: 14, rolling_avg_per_day: 1.7, longest_call_min: 41 },
    timestamp: '2026-02-13T00:00:00+05:30',
    entities: ['ph_rahul_2', 'ph_amit_1', 'p_rahul', 'p_amit'],
  },
  {
    id: 'CDR-2077',
    source_type: 'CDR',
    title: 'CDR extract — IMEI reuse',
    verbatim_text:
      '2026-03-02 09:47:11 | CALL OUT | +91 76210 90455 → +91 82699 33417 | duration 88s | IMEI 35-991172-887761-3. Same IMEI previously seen on +91 74150 88761 and +91 90391 55820. One handset, three subscriber numbers.',
    fields: { caller: '+91 76210 90455', callee: '+91 82699 33417', imei: '35-991172-887761-3', linked_numbers: '74150 88761; 90391 55820; 76210 90455', date: '2026-03-02' },
    timestamp: '2026-03-02T09:47:11+05:30',
    entities: ['ph_manoj_1', 'ph_rahul_2', 'ph_iqbal_1', 'p_manoj', 'p_rahul'],
  },
  {
    id: 'TXN-8872',
    source_type: 'TXN',
    title: 'Transaction TXN-8872',
    verbatim_text:
      '2026-01-19 12:04 | IMPS | HDFC ****4471 (Rahul Sharma) → ICICI ****9930 (Amit Khan) | Rs 4,50,000 | ref IMPS/903471/CR | remarks "adv-1".',
    fields: { channel: 'IMPS', sender: 'HDFC ****4471', receiver: 'ICICI ****9930', amount: 450000, date: '2026-01-19', ref: 'IMPS/903471/CR' },
    timestamp: '2026-01-19T12:04:00+05:30',
    entities: ['ac_rahul', 'ac_amit', 'p_rahul', 'p_amit'],
  },
  {
    id: 'TXN-8890',
    source_type: 'TXN',
    title: 'Transaction TXN-8890',
    verbatim_text:
      '2026-02-02 18:52 | UPI | ICICI ****9930 (Amit Khan) → SBI ****1188 (Sunil Yadav) | Rs 3,00,000 | UPI ref 403928172625 | VPA amitk@okicici → sunil.y@oksbi.',
    fields: { channel: 'UPI', sender: 'ICICI ****9930', receiver: 'SBI ****1188', amount: 300000, date: '2026-02-02', upi_ref: '403928172625' },
    timestamp: '2026-02-02T18:52:00+05:30',
    entities: ['ac_amit', 'ac_sunil', 'p_amit', 'p_sunil'],
  },
  {
    id: 'TXN-8901',
    source_type: 'TXN',
    title: 'Transaction TXN-8901 (round-trip)',
    verbatim_text:
      '2026-02-20 10:31 | NEFT | HDFC ****8804 (MP Traders) → HDFC ****4471 (Rahul Sharma) | Rs 4,50,000 | remarks "consultancy". Funds originally routed Amit Khan → MP Traders on 2026-02-17; returned to originating individual within 72h.',
    fields: { channel: 'NEFT', sender: 'HDFC ****8804 (MP Traders)', receiver: 'HDFC ****4471', amount: 450000, date: '2026-02-20', pattern: 'round-trip within 72h' },
    timestamp: '2026-02-20T10:31:00+05:30',
    entities: ['ac_shell', 'ac_rahul', 'org_mptraders', 'p_rahul'],
  },
  {
    id: 'SURV-0912',
    source_type: 'SURVEILLANCE',
    title: 'Surveillance note SURV-0912',
    verbatim_text:
      'Team observed white sedan MP04 CX 1337, registered to Rahul Sharma, parked outside a tea stall in MP Nagar at 19:10 on 2026-02-09. Amit Khan arrived on foot at 19:22, entered the front passenger seat; vehicle departed towards Habibganj at 19:41.',
    fields: { date: '2026-02-09', location: 'MP Nagar, Bhopal', vehicle: 'MP04 CX 1337', observed: 'Rahul Sharma, Amit Khan' },
    timestamp: '2026-02-09T19:10:00+05:30',
    entities: ['p_rahul', 'p_amit', 'v_mp04', 'loc_mpnagar'],
  },
  {
    id: 'VEH-4410',
    source_type: 'VEHICLE',
    title: 'Vehicle registration VEH-4410',
    verbatim_text:
      'Registration MP04 CX 1337 | Make: Honda City 2022 | Colour: White | Registered owner: Rahul Sharma, H.No. 114, Arera Colony, Bhopal | Hypothecation: none | Status: active.',
    fields: { reg_no: 'MP04 CX 1337', owner: 'Rahul Sharma', address: 'H.No. 114, Arera Colony, Bhopal', make: 'Honda City 2022' },
    timestamp: '2022-07-03T00:00:00+05:30',
    entities: ['v_mp04', 'p_rahul', 'loc_arera'],
  },
  {
    id: 'INTEL-77',
    source_type: 'INTEL',
    title: 'Intelligence note INTEL-77 (UNTRUSTED SOURCE TEXT)',
    verbatim_text:
      'Source reports that payouts in the "MP Traders" matter are coordinated by a person referred to only as "Rahul bhai", who uses a single handset into which SIMs are rotated. Source associates the handset with IMEI 35-991172-887761-3 and at least three numbers ending 88761, 55820 and 90455.',
    fields: { source_grade: 'B2 (usually reliable)', subject_alias: 'Rahul bhai', imei: '35-991172-887761-3' },
    timestamp: '2026-03-05T00:00:00+05:30',
    entities: ['p_rahul', 'p_iqbal', 'p_manoj', 'org_mptraders'],
  },
  {
    id: 'SURV-0930',
    source_type: 'SURVEILLANCE',
    title: 'Surveillance note SURV-0930',
    verbatim_text:
      'Enquiry at Rajwada, Indore regarding a "Rahul Sharma" found the individual to be Shri Rahul Sharma, PGT (Mathematics) at a Government Higher Secondary School, running evening tuition classes from his residence. No vehicle, no relevant financial activity, not known to any person of interest. Namesake only.',
    fields: { date: '2026-05-16', location: 'Rajwada, Indore', finding: 'namesake — schoolteacher, no linkage' },
    timestamp: '2026-05-16T18:00:00+05:30',
    entities: ['p_rahul_trap', 'loc_indore_rajwada'],
  },
]

/* -------------------------------------------------------- resolve queue */

export const RESOLVE_CARDS: ResolveCards = {
  merge: [
    {
      id: 'rc_merge_rsharma',
      decision: 'MERGE',
      left: { id: 'p_rsharma', label: 'R. Sharma', source: 'HDFC account-holder dump', descriptor: 'Account HDFC ****4471; address Arera Colony; phone ending 11241.' },
      right: { id: 'p_rahul', label: 'Rahul Sharma', source: 'FIR 1024/2026', descriptor: 'Named suspect; owns MP04 CX 1337; controls MP Traders account.' },
      signals: [
        { label: 'Name similarity', value: 0.88, weight: 0.25, note: '"R. Sharma" ↔ "Rahul Sharma" — initial + surname exact' },
        { label: 'Phone match', value: 1.0, weight: 0.3, note: 'Shared number +91 98260 11241' },
        { label: 'Account / asset link', value: 0.95, weight: 0.2, note: 'Same account HDFC ****4471 and vehicle MP04 CX 1337' },
        { label: 'Location similarity', value: 0.82, weight: 0.1, note: 'Both resolve to Arera Colony, Bhopal' },
        { label: 'Temporal overlap', value: 0.9, weight: 0.15, note: 'Activity windows overlap Jan–Mar 2026' },
      ],
      match_confidence: 0.927,
      merge_threshold: 0.85,
      review_band: [0.45, 0.85],
      rationale: 'Multiple independent hard identifiers agree (phone, account, vehicle). Merge is safe and reversible; both source records are retained as aliases of the canonical entity.',
      evidence_ids: ['TXN-8872', 'VEH-4410'],
    },
    {
      id: 'rc_merge_akhan',
      decision: 'MERGE',
      left: { id: 'p_akhan', label: 'A. Khan', source: 'CDR subscriber record', descriptor: 'Subscriber for +91 99931 40233; billing address MP Nagar.' },
      right: { id: 'p_amit', label: 'Amit Khan', source: 'FIR 1024/2026', descriptor: 'Named suspect; met Rahul Sharma at Bhopal Railway Station.' },
      signals: [
        { label: 'Name similarity', value: 0.8, weight: 0.25, note: '"A. Khan" ↔ "Amit Khan"' },
        { label: 'Phone match', value: 1.0, weight: 0.3, note: 'Number +91 99931 40233 appears in both' },
        { label: 'Account / asset link', value: 0.7, weight: 0.2, note: 'Billing address matches surveillance sighting area' },
        { label: 'Location similarity', value: 0.7, weight: 0.1, note: 'MP Nagar in both records' },
        { label: 'Temporal overlap', value: 0.88, weight: 0.15, note: 'Concurrent activity Feb 2026' },
      ],
      match_confidence: 0.865,
      merge_threshold: 0.85,
      review_band: [0.45, 0.85],
      rationale: 'Phone number is an exact hard identifier and timelines align. Just above the merge threshold — merged with a note; reversible.',
      evidence_ids: ['CDR-2031'],
    },
  ],
  refuse: [
    {
      id: 'rc_refuse_rahul',
      decision: 'REFUSE',
      is_trap: true,
      left: { id: 'p_rahul_trap', label: 'Rahul Sharma', source: 'SURV-0930 (Rajwada, Indore)', descriptor: 'PGT Mathematics schoolteacher; evening tuitions; no vehicle, no financial activity.' },
      right: { id: 'p_rahul', label: 'Rahul Sharma', source: 'FIR 1024/2026 (Bhopal)', descriptor: 'Fraud-network coordinator; rotates SIMs; controls a shell-firm account.' },
      signals: [
        { label: 'Name similarity', value: 1.0, weight: 0.25, note: 'Exact string match — the ONLY signal that agrees' },
        { label: 'Phone match', value: 0.0, weight: 0.3, note: 'No shared number' },
        { label: 'Account / asset link', value: 0.0, weight: 0.2, note: 'No shared account or vehicle' },
        { label: 'Location similarity', value: 0.35, weight: 0.1, note: 'Indore vs Bhopal — different cities' },
        { label: 'Temporal overlap', value: 0.2, weight: 0.15, note: 'Activity windows never coincide' },
      ],
      match_confidence: 0.315,
      merge_threshold: 0.85,
      review_band: [0.45, 0.85],
      rationale: 'Name is identical but every behavioural and hard-identifier signal disagrees. Merging would attribute an innocent schoolteacher to a fraud network. Kept SEPARATE.',
      discriminators: [
        'No shared phone number, account, or vehicle',
        'Different city — Indore (Rajwada) vs Bhopal (Arera Colony / MP Nagar)',
        'Occupation mismatch — government schoolteacher vs shell-firm operator',
        'Activity windows never overlap',
      ],
      evidence_ids: ['SURV-0930'],
    },
    {
      id: 'rc_refuse_amit',
      decision: 'REFUSE',
      is_trap: true,
      left: { id: 'p_amit_trap', label: 'Amit Khan', source: 'VAHAN dealer registry (Dewas)', descriptor: 'Auto-parts dealer, Dewas; GST-registered shop; no LEA record.' },
      right: { id: 'p_amit', label: 'Amit Khan', source: 'FIR 1024/2026 (Bhopal)', descriptor: 'Money handler in the mule-account network.' },
      signals: [
        { label: 'Name similarity', value: 1.0, weight: 0.25, note: 'Exact string match' },
        { label: 'Phone match', value: 0.0, weight: 0.3, note: 'No shared number' },
        { label: 'Account / asset link', value: 0.1, weight: 0.2, note: 'Unrelated GST business account' },
        { label: 'Location similarity', value: 0.3, weight: 0.1, note: 'Dewas vs Bhopal' },
        { label: 'Temporal overlap', value: 0.15, weight: 0.15, note: 'No coincident activity' },
      ],
      match_confidence: 0.3,
      merge_threshold: 0.85,
      review_band: [0.45, 0.85],
      rationale: 'Common name, nothing else. A legitimate business owner in Dewas is not the Bhopal suspect. Kept SEPARATE.',
      discriminators: [
        'No shared phone, account, or asset',
        'Different city — Dewas vs Bhopal',
        'GST-registered auto-parts business vs no declared occupation',
        'No overlapping activity windows',
      ],
      evidence_ids: [],
    },
  ],
  review: [
    {
      id: 'rc_review_imran',
      decision: 'REVIEW',
      left: { id: 'p_imran', label: 'Imran Sheikh', source: 'Field enquiry note', descriptor: 'Peripheral associate seen with Sunil Yadav; partial address Habibganj.' },
      right: { id: 'p_imran_partial', label: 'Imran S.', source: 'Partial CDR record (truncated)', descriptor: 'Truncated subscriber name; one call leg overlaps a network number; location cell consistent with Habibganj.' },
      signals: [
        { label: 'Name similarity', value: 0.72, weight: 0.25, note: '"Imran S." could be "Imran Sheikh" or "Imran Sayyed"' },
        { label: 'Phone match', value: 0.5, weight: 0.3, note: 'One shared call leg, not independently confirmed' },
        { label: 'Account / asset link', value: 0.0, weight: 0.2, note: 'No account data on either record' },
        { label: 'Location similarity', value: 0.6, weight: 0.1, note: 'Both cells fall in Habibganj' },
        { label: 'Temporal overlap', value: 0.55, weight: 0.15, note: 'Partial overlap in February' },
      ],
      match_confidence: 0.4725,
      merge_threshold: 0.85,
      review_band: [0.45, 0.85],
      rationale: 'Confidence falls inside the review band. Suggestive but not conclusive — routed to an investigator to accept or reject. The system does not guess.',
      evidence_ids: [],
    },
  ],
}

/* --------------------------------------------------------- custody log seed */

interface AuditSeed {
  action: AuditEvent['action']
  actor: string
  target: string
  timestamp: string
}

export const AUDIT_SEED: AuditSeed[] = [
  { action: 'INGEST', actor: 'system', target: 'FIR bundle · 10 records', timestamp: '2026-05-20T08:40:12+05:30' },
  { action: 'INGEST', actor: 'system', target: 'CDR export · 30 rows', timestamp: '2026-05-20T08:41:03+05:30' },
  { action: 'INGEST', actor: 'system', target: 'Transaction dump · 50 rows', timestamp: '2026-05-20T08:41:47+05:30' },
  { action: 'RUN_HEURISTICS', actor: 'system', target: 'person-projection · 7 heuristics', timestamp: '2026-05-20T08:43:20+05:30' },
  { action: 'RESOLVE_MERGE', actor: 'insp.rao@ncrb', target: 'R. Sharma → Rahul Sharma', timestamp: '2026-05-20T09:05:11+05:30' },
  { action: 'RESOLVE_REFUSE', actor: 'insp.rao@ncrb', target: 'Rahul Sharma (Indore) ✕ Rahul Sharma (Bhopal)', timestamp: '2026-05-20T09:07:44+05:30' },
  { action: 'RESOLVE_MERGE', actor: 'insp.rao@ncrb', target: 'A. Khan → Amit Khan', timestamp: '2026-05-20T09:09:02+05:30' },
  { action: 'VIEW_ENTITY', actor: 'insp.rao@ncrb', target: 'Rahul Sharma', timestamp: '2026-05-20T09:15:36+05:30' },
  { action: 'VIEW_ENTITY', actor: 'asi.menon@ncrb', target: 'Amit Khan', timestamp: '2026-05-20T09:22:10+05:30' },
  { action: 'REPORT_GENERATE', actor: 'insp.rao@ncrb', target: 'Case FIR1024 · subject Rahul Sharma', timestamp: '2026-05-20T09:31:58+05:30' },
]
