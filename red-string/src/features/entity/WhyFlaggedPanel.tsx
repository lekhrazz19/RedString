import { useMemo, useState } from 'react'
import { Info, RotateCcw } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EvidenceRefList } from '@/components/evidence/EvidenceRef'
import { HEURISTIC_WEIGHTS } from '@/lib/fixtures/dataset'
import type { GraphNode, HeuristicKey } from '@/lib/api/types'
import type { EntityDetail } from '@/lib/api'
import { cn } from '@/lib/utils'

const KEYS = Object.keys(HEURISTIC_WEIGHTS) as HeuristicKey[]

export function WhyFlaggedPanel({
  node,
  fired,
}: {
  node: GraphNode
  fired: EntityDetail['fired']
}) {
  const [weights, setWeights] = useState<Record<HeuristicKey, number>>({ ...HEURISTIC_WEIGHTS })
  const sub = useMemo(() => node.sub_scores ?? {}, [node])

  const { adjusted, baseline } = useMemo(() => {
    const score = (w: Record<HeuristicKey, number>) =>
      KEYS.reduce((s, k) => s + (sub[k] ?? 0) * w[k], 0) * 10
    return { adjusted: score(weights), baseline: score(HEURISTIC_WEIGHTS) }
  }, [weights, sub])

  const dirty = KEYS.some((k) => weights[k] !== HEURISTIC_WEIGHTS[k])

  if (!fired.length) {
    return (
      <p className="rounded-md border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
        No suspicious-pattern heuristics fired for this entity. It appears in the graph as a
        contact only.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-2.5 text-[11px] text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <p>
          This is an investigative <strong className="text-foreground">ranking score</strong> (0–10),
          not a probability of guilt. Every factor below is a named, queryable heuristic. Weights are
          adjustable — the score recomputes from the same evidence.
        </p>
      </div>

      <div className="flex items-baseline gap-3">
        <div>
          <div className="font-mono text-2xl font-semibold tabular-nums">
            {adjusted.toFixed(1)}
            <span className="text-sm text-muted-foreground"> / 10</span>
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {dirty ? `re-weighted (baseline ${baseline.toFixed(1)})` : 'current ranking score'}
          </div>
        </div>
        {dirty && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto gap-1 text-[11px]"
            onClick={() => setWeights({ ...HEURISTIC_WEIGHTS })}
          >
            <RotateCcw className="h-3 w-3" />
            reset weights
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {fired.map((f) => {
          const contribution = (sub[f.key] ?? 0) * weights[f.key] * 10
          return (
            <div key={f.key} className="rounded-md border border-border p-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="string" className="text-[10px]">
                    {f.key}
                  </Badge>
                  <span className="text-xs font-medium">{f.label}</span>
                </div>
                <span className="font-mono text-xs tabular-nums text-string">
                  +{contribution.toFixed(2)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{f.catches}</p>
              <p className="mt-0.5 text-[11px]">
                <span className="text-muted-foreground">Fired on:</span>{' '}
                <span className="font-mono text-[10px]">{f.threshold}</span>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="w-16 shrink-0 text-[10px] text-muted-foreground">
                  weight {weights[f.key].toFixed(2)}
                </span>
                <Slider
                  value={[weights[f.key]]}
                  min={0}
                  max={0.4}
                  step={0.01}
                  onValueChange={([v]) => setWeights((w) => ({ ...w, [f.key]: v }))}
                  className="flex-1"
                />
              </div>
            </div>
          )
        })}
      </div>

      <div>
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Supporting evidence
        </div>
        <EvidenceRefList ids={node.evidence_ids ?? []} />
      </div>

      <div className={cn('h-px w-full bg-border')} />
      <p className="text-[10px] text-muted-foreground">
        Score aggregation follows the documented weighting (Hub .25 · Broker .25 · Burst .15 · New
        Connection .15 · Star .10 · Fade-Out .05 · Community .05) × 10.
      </p>
    </div>
  )
}
