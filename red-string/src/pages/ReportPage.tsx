import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Printer } from 'lucide-react'
import * as api from '@/lib/api'
import type { ReportPayload } from '@/lib/api/types'
import { Button } from '@/components/ui/button'
import { EvidenceRef } from '@/components/evidence/EvidenceRef'
import { priorityBand } from '@/lib/graph/theme'
import { formatDate, formatDateTime, formatINR } from '@/lib/utils'

const BASE_TITLE = 'red.string — criminal network intelligence'
const TN = {
  blue: 'var(--tn-blue)',
  cyan: 'var(--tn-cyan)',
  purple: 'var(--tn-purple)',
  green: 'var(--tn-green)',
  red: 'var(--tn-red)',
  orange: 'var(--tn-orange)',
  yellow: 'var(--tn-yellow)',
  comment: 'var(--tn-comment)',
  rule: 'var(--tn-rule)',
}

export function ReportPage() {
  const { entityId } = useParams()
  const navigate = useNavigate()
  const [payload, setPayload] = useState<ReportPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const logged = useRef<string | null>(null)

  useEffect(() => {
    if (!entityId) return
    let cancelled = false
    setPayload(null)
    setError(null)
    api
      .getReportPayload(entityId)
      .then((p) => !cancelled && setPayload(p))
      .catch((e) =>
        !cancelled && setError(e instanceof Error ? e.message : 'Could not compose this report'),
      )
    return () => {
      cancelled = true
    }
  }, [entityId])

  // log the generation exactly once per subject (survives StrictMode double-effect)
  useEffect(() => {
    if (!payload || logged.current === payload.subject.id) return
    logged.current = payload.subject.id
    api.logReportGenerated(payload.case_id, payload.subject.label)
  }, [payload])

  // give the exported PDF a filename that follows the subject
  useEffect(() => {
    if (!payload) return
    const clean = payload.subject.label.replace(/[\\/:*?"<>|]+/g, '').trim()
    const set = () => {
      document.title = `red.string report — ${clean} — ${payload.case_id}`
    }
    const restore = () => {
      document.title = BASE_TITLE
    }
    window.addEventListener('beforeprint', set)
    window.addEventListener('afterprint', restore)
    return () => {
      window.removeEventListener('beforeprint', set)
      window.removeEventListener('afterprint', restore)
      restore()
    }
  }, [payload])

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <AlertTriangle className="h-6 w-6 text-string" />
        <p className="max-w-sm text-xs text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Button>
      </div>
    )
  }

  if (!payload) {
    return (
      <div className="flex h-full items-center justify-center bg-background text-xs text-muted-foreground">
        Composing report…
      </div>
    )
  }

  const band = priorityBand(payload.ranking_score)
  const flowsTotal = payload.financial_flows.reduce((s, f) => s + f.amount, 0)

  return (
    <div className="report-scroll h-full overflow-auto bg-background">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/80 px-4 py-2 backdrop-blur">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate('/')}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Button>
        <div className="text-[11px] text-muted-foreground">
          Court-ready case report · generated {formatDateTime(payload.generated)}
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" />
          Export PDF
        </Button>
      </div>

      <article className="report-sheet mx-auto my-6 max-w-3xl rounded-lg border border-border bg-card p-8 text-[13px] leading-relaxed">
        {/* ---- letterhead ---- */}
        <header
          className="mb-6 flex items-start justify-between gap-4 border-b pb-4"
          style={{ borderColor: TN.blue, borderBottomWidth: 2 }}
        >
          <div>
            <div className="font-mono text-base font-semibold tracking-tight">
              red<span style={{ color: TN.red }}>.</span>string
            </div>
            <h1 className="mt-0.5 text-lg font-semibold">Case Intelligence Report</h1>
            <p className="mt-1 text-[11px] text-muted-foreground">
              SIH26189 · NCRB Women Safety Division · human-in-the-loop · no automated adverse
              decision
            </p>
          </div>
          <dl className="shrink-0 space-y-0.5 text-right text-[11px]">
            <MetaRow k="Case" v={payload.case_id} accent={TN.blue} mono />
            <MetaRow k="Subject" v={payload.subject.label} />
            <MetaRow k="Generated" v={formatDateTime(payload.generated)} />
            <MetaRow k="Officer" v={payload.actor} mono />
          </dl>
        </header>

        <div
          className="mb-6 rounded-md border px-3 py-1.5 text-[11px]"
          style={{
            borderColor: 'var(--tn-orange-line)',
            color: TN.orange,
            background: 'var(--tn-orange-bg)',
          }}
        >
          Synthetic prototype dataset — illustrative only, not evidential.
        </div>

        {/* ---- A · subject & assessment ---- */}
        <Part letter="A" title="Subject & assessment">
          <div className="grid grid-cols-[1fr_auto] gap-6">
            <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1 text-xs">
              <KV k="Name" v={payload.subject.label} />
              <KV k="Aliases" v={payload.subject.aliases?.join(' · ') ?? '—'} />
              <KV k="Community" v={payload.subject.community != null ? `#${payload.subject.community}` : '—'} />
              <KV k="Rank in case" v={payload.subject.rank ? `#${payload.subject.rank}` : '—'} />
              <KV k="Analyst note" v={String(payload.subject.meta?.role ?? '—')} />
            </dl>
            <div className="w-44 shrink-0">
              <div className="mb-1 flex items-baseline justify-between">
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ color: band.color, background: `${band.color}22` }}
                >
                  {band.label}
                </span>
                <span className="font-mono text-lg font-semibold tabular-nums">
                  {payload.ranking_score.toFixed(1)}
                  <span className="text-xs text-muted-foreground"> / 10</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: TN.rule }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${payload.ranking_score * 10}%`, background: band.color }}
                />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                investigative ranking signal — not a probability of guilt
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-1.5">
            {(
              [
                ['Connections', payload.counts.connections],
                ['Communities', payload.counts.communities],
                ['Financial', payload.counts.financial],
                ['Comms', payload.counts.communication],
                ['Locations', payload.counts.locations],
              ] as const
            ).map(([k, v]) => (
              <div
                key={k}
                className="rounded border px-2 py-1.5 text-center"
                style={{ borderColor: TN.rule }}
              >
                <div className="font-mono text-sm font-semibold tabular-nums">{v}</div>
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{k}</div>
              </div>
            ))}
          </div>

          <SubHeading>Why flagged — heuristics that fired</SubHeading>
          {payload.fired_heuristics.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              No suspicious-pattern heuristics fired. Subject appears as a contact only.
            </p>
          ) : (
            <RTable head={['Heuristic', 'What it catches', 'Threshold that tripped', 'Weight']}>
              {payload.fired_heuristics.map((h) => (
                <tr key={h.key} className="report-item">
                  <Td>
                    <span style={{ color: TN.red }}>{h.key}</span> · {h.label}
                  </Td>
                  <Td className="text-muted-foreground">{h.catches}</Td>
                  <Td className="font-mono text-[10px]">{h.threshold}</Td>
                  <Td className="text-right font-mono tabular-nums">{h.weight.toFixed(2)}</Td>
                </tr>
              ))}
            </RTable>
          )}
        </Part>

        {/* ---- B · relationships ---- */}
        <Part letter="B" title="Network relationships">
          <RTable head={['Counterpart', 'Community', 'Relation', 'Flag', 'Strength', 'Evidence']}>
            {payload.relationships.map((r) => (
              <tr key={r.entity} className="report-item">
                <Td>{r.entity}</Td>
                <Td className="font-mono text-[10px] text-muted-foreground">
                  {r.community != null ? `#${r.community}` : '—'}
                </Td>
                <Td className="text-muted-foreground">{r.relation}</Td>
                <Td style={r.suspicious ? { color: TN.red } : undefined}>
                  {r.suspicious ? '● suspicious' : '—'}
                </Td>
                <Td className="text-right font-mono tabular-nums">{r.strength.toFixed(2)}</Td>
                <Td>
                  <RefList ids={r.evidence_ids} />
                </Td>
              </tr>
            ))}
          </RTable>
        </Part>

        {/* ---- C · financial ---- */}
        <Part letter="C" title="Financial flows">
          {payload.financial_flows.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No transfers on record.</p>
          ) : (
            <RTable head={['Date', 'From', 'To', 'Channel', 'Amount', 'Evidence']}>
              {payload.financial_flows.map((f, i) => (
                <tr key={i} className="report-item">
                  <Td className="font-mono text-[10px]" style={{ color: TN.cyan }}>
                    {formatDate(f.when)}
                  </Td>
                  <Td>{f.from}</Td>
                  <Td>{f.to}</Td>
                  <Td className="font-mono text-[10px] text-muted-foreground">{f.channel}</Td>
                  <Td className="text-right font-mono tabular-nums">{formatINR(f.amount)}</Td>
                  <Td>
                    <RefList ids={f.evidence_id ? [f.evidence_id] : []} />
                  </Td>
                </tr>
              ))}
              <tr>
                <Td className="font-semibold" colSpan={4}>
                  Total moved
                </Td>
                <Td
                  className="text-right font-mono font-semibold tabular-nums"
                  style={{ color: TN.yellow }}
                >
                  {formatINR(flowsTotal)}
                </Td>
                <Td />
              </tr>
            </RTable>
          )}
        </Part>

        {/* ---- D · chronology ---- */}
        <Part letter="D" title="Chronology">
          <RTable head={['Date', 'Event', 'Source']}>
            {payload.timeline.map((t, i) => (
              <tr key={i} className="report-item">
                <Td className="whitespace-nowrap font-mono text-[10px]" style={{ color: TN.cyan }}>
                  {formatDate(t.timestamp)}
                </Td>
                <Td>{t.label}</Td>
                <Td>
                  <RefList ids={t.evidence_id ? [t.evidence_id] : []} />
                </Td>
              </tr>
            ))}
          </RTable>
        </Part>

        {/* ---- E · evidence appendix ---- */}
        <Part letter="E" title="Evidence appendix — verbatim extracts">
          <div className="space-y-2.5">
            {payload.evidence.map((ev, i) => (
              <div
                key={ev.id}
                className="report-item rounded-md border py-2 pl-3 pr-2"
                style={{ borderColor: TN.rule, borderLeftColor: TN.blue, borderLeftWidth: 3 }}
              >
                <div className="mb-0.5 font-mono text-[10px]">
                  <span style={{ color: TN.purple }}>E{i + 1}</span>
                  <span className="text-muted-foreground"> · {ev.id} · {ev.title}</span>
                </div>
                <p className="text-xs">{ev.verbatim_text}</p>
              </div>
            ))}
          </div>
        </Part>

        {/* ---- F · integrity ---- */}
        <Part letter="F" title="Integrity — custody hash-chain">
          <p className="mb-2 break-all font-mono text-[11px]">
            <span className="text-muted-foreground">chain root: </span>
            <span style={{ color: TN.green }}>{payload.custody_root || '—'}</span>
          </p>
          <RTable head={['Artifact', 'SHA-256 of record content']}>
            {payload.hash_manifest.map((m) => (
              <tr key={m.artifact} className="report-item">
                <Td className="whitespace-nowrap font-mono text-[10px]">{m.artifact}</Td>
                <Td className="break-all font-mono text-[10px]" style={{ color: TN.comment }}>
                  {m.hash}
                </Td>
              </tr>
            ))}
          </RTable>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Every artifact hash is chained SHA-256. Any post-hoc edit to a record breaks
            verification from that entry onward — verify live in the Trust view.
          </p>
        </Part>

        {/* ---- signatures ---- */}
        <div className="mt-10 grid grid-cols-3 gap-6 text-[11px]">
          {['Prepared by', 'Reviewed by', 'Date'].map((l) => (
            <div key={l} className="sig-line mt-8 border-t pt-1" style={{ borderColor: TN.comment }}>
              {l}
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}

/* ---------------------------------------------------------------- helpers */

function Part({
  letter,
  title,
  children,
}: {
  letter: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="report-part mb-6">
      <h2
        className="mb-2 flex items-center gap-2 border-b pb-1 text-sm font-semibold"
        style={{ borderColor: 'var(--tn-blue-line)' }}
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded font-mono text-[11px]"
          style={{ color: TN.blue, background: 'var(--tn-blue-bg)' }}
        >
          {letter}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="mb-1.5 mt-4 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color: TN.comment }}
    >
      {children}
    </h3>
  )
}

function RTable({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-left" style={{ borderColor: 'var(--tn-blue-line)' }}>
            {head.map((h, i) => (
              <th
                key={h}
                className={`py-1 pr-3 font-medium ${i === head.length - 1 ? 'pr-0' : ''}`}
                style={{ color: TN.comment }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Td({
  children,
  className = '',
  style,
  colSpan,
}: {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  colSpan?: number
}) {
  return (
    <td
      colSpan={colSpan}
      className={`border-b py-1 pr-3 align-top last:pr-0 ${className}`}
      style={{ borderColor: TN.rule, ...style }}
    >
      {children}
    </td>
  )
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </>
  )
}

function MetaRow({
  k,
  v,
  accent,
  mono,
}: {
  k: string
  v: string
  accent?: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-end gap-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={mono ? 'font-mono' : ''} style={accent ? { color: accent } : undefined}>
        {v}
      </dd>
    </div>
  )
}

function RefList({ ids }: { ids: string[] }) {
  if (!ids.length) return <span className="text-[10px] text-muted-foreground">—</span>
  return (
    <span className="inline-flex flex-wrap gap-1">
      {ids.map((id) => (
        <EvidenceRef key={id} id={id} />
      ))}
    </span>
  )
}
