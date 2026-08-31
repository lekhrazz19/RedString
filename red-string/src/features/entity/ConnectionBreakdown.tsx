import { Banknote, MapPin, Phone, Users2, Boxes } from 'lucide-react'
import type { EntityDetail } from '@/lib/api'

const ITEMS = [
  { key: 'connections', label: 'Connections', icon: Users2 },
  { key: 'communities', label: 'Communities', icon: Boxes },
  { key: 'financial', label: 'Financial', icon: Banknote },
  { key: 'communication', label: 'Comms', icon: Phone },
  { key: 'locations', label: 'Locations', icon: MapPin },
] as const

export function ConnectionBreakdown({ counts }: { counts: EntityDetail['counts'] }) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {ITEMS.map(({ key, label, icon: Icon }) => (
        <div
          key={key}
          className="flex flex-col items-center gap-1 rounded-md border border-border bg-secondary/40 px-1 py-2"
        >
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-sm font-semibold tabular-nums">{counts[key]}</span>
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  )
}
