import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowRight, Ban, Check, ChevronDown, GitMerge, HelpCircle, Undo2 } from 'lucide-react'
import type { ResolveCard, ResolveOutcome } from '@/lib/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EvidenceRefList } from '@/components/evidence/EvidenceRef'
import { cn } from '@/lib/utils'
import { useResolveStore } from '@/lib/store/resolveStore'
import { EvidenceMathTable } from './EvidenceMathTable'

const DECISION_META = {
  MERGE: { icon: GitMerge, tone: 'border-emerald-500/40', label: 'MERGE', badge: 'success' as const },
  REFUSE: { icon: Ban, tone: 'border-string/50', label: 'REFUSE', badge: 'string' as const },
  REVIEW: { icon: HelpCircle, tone: 'border-amber-500/40', label: 'REVIEW', badge: 'warning' as const },
}

const OUTCOME_TEXT: Record<ResolveOutcome, string> = {
  merge_confirmed: 'Merged — retained as aliases, reversible',
  merge_held: 'Held — sent to review queue',
  refuse_upheld: 'Kept separate — refusal upheld',
  review_accepted: 'Accepted as a match',
  review_rejected: 'Rejected — kept separate',
}

export function ResolveCardView({
  card,
  decision,
}: {
  card: ResolveCard
  decision?: ResolveOutcome
}) {
  const decide = useResolveStore((s) => s.decide)
  const [expanded, setExpanded] = useState(false)
  const [changing, setChanging] = useState(false)
  const meta = DECISION_META[card.decision]
  const Icon = meta.icon

  const isDecided = !!decision
  const showBody = !isDecided || expanded
  const showActions = !isDecided || changing

  async function choose(outcome: ResolveOutcome, verb: string) {
    await decide(card.id, outcome)
    toast.success(`${verb} · logged to custody chain`)
    setChanging(false)
    setExpanded(false)
  }

  return (
    <div className={cn('rounded-lg border bg-card', meta.tone, isDecided && 'opacity-70')}>
      <button
        type="button"
        disabled={!isDecided}
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between border-b border-border px-3 py-2 text-left disabled:cursor-default"
      >
        <div className="flex min-w-0 items-center gap-2">
          <Icon
            className={cn(
              'h-4 w-4 shrink-0',
              card.decision === 'MERGE' && 'text-emerald-400',
              card.decision === 'REFUSE' && 'text-string',
              card.decision === 'REVIEW' && 'text-amber-400',
            )}
          />
          <Badge variant={meta.badge} className="text-[10px]">
            {meta.label}
          </Badge>
          {card.is_trap && (
            <Badge variant="outline" className="shrink-0 text-[9px] text-muted-foreground">
              planted trap
            </Badge>
          )}
          {isDecided && (
            <span className="truncate text-[11px] text-muted-foreground">
              {card.left.label} ↔ {card.right.label}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isDecided ? (
            <>
              <span className="hidden text-[10px] text-muted-foreground sm:inline">
                {OUTCOME_TEXT[decision]}
              </span>
              <ChevronDown
                className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', expanded && 'rotate-180')}
              />
            </>
          ) : (
            <span className="font-mono text-[10px] text-muted-foreground">
              conf {card.match_confidence.toFixed(3)}
            </span>
          )}
        </div>
      </button>

      {showBody && (
        <div className="space-y-3 p-3">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <IdentitySide label={card.left.label} source={card.left.source} desc={card.left.descriptor} />
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <IdentitySide
              label={card.right.label}
              source={card.right.source}
              desc={card.right.descriptor}
              align="right"
            />
          </div>

          <EvidenceMathTable signals={card.signals} confidence={card.match_confidence} />

          <ThresholdBar card={card} />

          <p className="text-[11px] text-muted-foreground">{card.rationale}</p>

          {card.decision === 'REFUSE' && card.discriminators && (
            <div className="rounded-md border border-string/30 bg-string/5 p-2">
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-string">
                Why these are kept separate
              </div>
              <ul className="space-y-0.5">
                {card.discriminators.map((d) => (
                  <li key={d} className="flex gap-1.5 text-[11px] text-foreground/90">
                    <span className="text-string">✕</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {card.evidence_ids.length > 0 && (
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                Source records
              </div>
              <EvidenceRefList ids={card.evidence_ids} />
            </div>
          )}

          {isDecided && !changing && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground">{OUTCOME_TEXT[decision]}</span>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-[11px]"
                onClick={() => setChanging(true)}
              >
                <Undo2 className="h-3.5 w-3.5" />
                Change decision
              </Button>
            </div>
          )}

          {showActions && (
            <div className="flex gap-2 pt-1">
              {card.decision === 'MERGE' && (
                <>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => choose('merge_confirmed', 'Merge confirmed')}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Confirm merge
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5"
                    onClick={() => choose('merge_held', 'Merge held')}
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    Hold
                  </Button>
                </>
              )}

              {card.decision === 'REFUSE' && (
                <Button
                  size="sm"
                  variant="string"
                  className="gap-1.5"
                  onClick={() => choose('refuse_upheld', 'Refusal upheld')}
                >
                  <Ban className="h-3.5 w-3.5" />
                  Uphold — keep separate
                </Button>
              )}

              {card.decision === 'REVIEW' && (
                <>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => choose('review_accepted', 'Match accepted')}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => choose('review_rejected', 'Match rejected')}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </>
              )}

              {changing && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[11px]"
                  onClick={() => setChanging(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function IdentitySide({
  label,
  source,
  desc,
  align,
}: {
  label: string
  source: string
  desc: string
  align?: 'right'
}) {
  return (
    <div className={cn('min-w-0', align === 'right' && 'text-right')}>
      <div className="truncate text-xs font-semibold">{label}</div>
      <div className="truncate text-[10px] text-muted-foreground">{source}</div>
      <div className="mt-0.5 text-[10px] leading-snug text-foreground/70">{desc}</div>
    </div>
  )
}

function ThresholdBar({ card }: { card: ResolveCard }) {
  const [low, high] = card.review_band
  const pct = (v: number) => `${Math.min(100, Math.max(0, v * 100))}%`
  return (
    <div>
      <div className="relative h-2 w-full rounded-full bg-secondary">
        <div
          className="absolute inset-y-0 rounded-full bg-amber-500/30"
          style={{ left: pct(low), right: `${100 - high * 100}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-foreground"
          style={{ left: pct(card.match_confidence) }}
        />
      </div>
      <div className="mt-0.5 flex justify-between text-[9px] text-muted-foreground">
        <span>refuse &lt; {low.toFixed(2)}</span>
        <span>review band</span>
        <span>merge ≥ {card.merge_threshold.toFixed(2)}</span>
      </div>
    </div>
  )
}
