import type { GraphSchema } from '@/lib/api/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { communityColor, priorityBand } from '@/lib/graph/theme'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/lib/store/uiStore'

export function PriorityList({ graph }: { graph: GraphSchema }) {
  const selectedEntityId = useUiStore((s) => s.selectedEntityId)
  const selectEntity = useUiStore((s) => s.selectEntity)

  const ranked = graph.nodes
    .filter((n) => n.type === 'PERSON' && (n.priority_score ?? 0) > 0 && !n.meta?.alias_of)
    .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-xs font-semibold">High-priority entities</h2>
        <p className="text-[10px] text-muted-foreground">
          investigative ranking score · not a probability
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {ranked.map((n, i) => {
            const band = priorityBand(n.priority_score)
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => selectEntity(n.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent',
                  selectedEntityId === n.id && 'bg-primary/10',
                )}
              >
                <span className="w-4 shrink-0 font-mono text-[10px] text-muted-foreground">
                  {i + 1}
                </span>
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: communityColor(n.community) }}
                />
                <span className="min-w-0 flex-1 truncate text-xs font-medium" title={n.label}>
                  {n.label}
                </span>
                <span
                  className="w-8 shrink-0 text-right font-mono text-xs font-semibold tabular-nums"
                  style={{ color: band.color }}
                >
                  {(n.priority_score ?? 0).toFixed(1)}
                </span>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
