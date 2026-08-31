import type { GraphView } from '@/lib/store/uiStore'
import { COMMUNITY_COLORS } from '@/lib/graph/theme'

const COMMUNITY_LABELS: Record<number, string> = {
  1: 'Core ring',
  2: 'Mule pool',
  3: 'Recruiters',
  4: 'Legitimate cluster',
  5: 'Noise',
  6: 'Namesake / trap',
}

export function GraphLegend({ view }: { view: GraphView }) {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 space-y-2 rounded-md border border-border bg-card/90 p-2.5 text-[10px] backdrop-blur">
      <div>
        <div className="mb-1 font-medium uppercase tracking-wide text-muted-foreground">
          Communities
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          {[1, 2, 3, 4, 5, 6].map((c) => (
            <div key={c} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: COMMUNITY_COLORS[c] }}
              />
              {COMMUNITY_LABELS[c]}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border pt-1.5">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-string" /> suspicious link
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-500 shadow-[0_0_0_2px_rgba(239,68,68,0.5)]" />{' '}
            high priority
          </span>
          {view === 'full' && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-emerald-400" /> transfer
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-sky-400" /> call
              </span>
            </>
          )}
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-500 shadow-[0_0_0_2px_#93c5fd,0_0_6px_2px_rgba(59,130,246,0.6)]" />{' '}
            selected
          </span>
        </div>
      </div>
    </div>
  )
}
