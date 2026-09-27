import type { GraphSchema } from '@/lib/api/types'

export function StatCounters({ graph }: { graph: GraphSchema }) {
  const persons = graph.nodes.filter((n) => n.type === 'PERSON' && !n.meta?.alias_of)
  const entities = graph.nodes.length
  const relationships = graph.edges.filter((e) => e.type !== 'SAME_AS').length
  const cases = graph.nodes.filter((n) => n.type === 'CASE').length
  const flagged = persons.filter((p) => (p.priority_score ?? 0) >= 7).length

  const items = [
    { label: 'Cases', value: cases },
    { label: 'Entities', value: entities },
    { label: 'Persons', value: persons.length },
    { label: 'Relationships', value: relationships },
    { label: 'High-priority', value: flagged, accent: true },
  ]

  return (
    <div className="flex divide-x divide-border rounded-lg border border-border bg-card">
      {items.map((it) => (
        <div key={it.label} className="flex-1 px-4 py-2.5">
          <div
            className={`font-mono text-xl font-semibold tabular-nums ${
              it.accent ? 'text-string' : ''
            }`}
          >
            {it.value}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {it.label}
          </div>
        </div>
      ))}
    </div>
  )
}
