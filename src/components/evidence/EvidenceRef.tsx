import type { EvidenceSource } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/lib/store/uiStore'

const SOURCE_COLOR: Record<EvidenceSource, string> = {
  FIR: 'bg-rose-400',
  CDR: 'bg-sky-400',
  TXN: 'bg-emerald-400',
  SURVEILLANCE: 'bg-amber-400',
  VEHICLE: 'bg-yellow-500',
  INTEL: 'bg-violet-400',
}

function sourceOf(id: string): EvidenceSource {
  const p = id.split('-')[0]
  if (p === 'FIR') return 'FIR'
  if (p === 'CDR') return 'CDR'
  if (p === 'TXN') return 'TXN'
  if (p === 'SURV') return 'SURVEILLANCE'
  if (p === 'VEH') return 'VEHICLE'
  return 'INTEL'
}

export function EvidenceRef({ id, className }: { id: string; className?: string }) {
  const openEvidence = useUiStore((s) => s.openEvidence)
  return (
    <button
      type="button"
      onClick={() => openEvidence(id)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded border border-border bg-transparent px-1.5 py-0.5 font-mono text-[11px] text-foreground transition-colors hover:border-primary hover:text-primary',
        className,
      )}
      title={`Open source record ${id}`}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', SOURCE_COLOR[sourceOf(id)])} />
      {id}
    </button>
  )
}

export function EvidenceRefList({ ids }: { ids: string[] }) {
  if (!ids.length) return <span className="text-[11px] text-muted-foreground">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {ids.map((id) => (
        <EvidenceRef key={id} id={id} />
      ))}
    </div>
  )
}
