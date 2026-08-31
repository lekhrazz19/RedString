import type { ResolveSignal } from '@/lib/api/types'
import { cn } from '@/lib/utils'

export function EvidenceMathTable({
  signals,
  confidence,
}: {
  signals: ResolveSignal[]
  confidence: number
}) {
  return (
    <div className="rounded-md border border-border">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="px-2 py-1 text-left font-medium">Signal</th>
            <th className="px-2 py-1 text-right font-medium">Value</th>
            <th className="px-2 py-1 text-right font-medium">Weight</th>
            <th className="px-2 py-1 text-right font-medium">Contribution</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((s) => {
            const contribution = s.value * s.weight
            return (
              <tr key={s.label} className="border-b border-border/50 last:border-0">
                <td className="px-2 py-1">
                  <div className="font-medium text-foreground">{s.label}</div>
                  {s.note && <div className="text-[10px] text-muted-foreground">{s.note}</div>}
                </td>
                <td className="px-2 py-1 text-right">
                  <span
                    className={cn(
                      'font-mono tabular-nums',
                      s.value === 0 && 'text-destructive',
                      s.value >= 0.85 && 'text-emerald-400',
                    )}
                  >
                    {s.value.toFixed(2)}
                  </span>
                </td>
                <td className="px-2 py-1 text-right font-mono tabular-nums text-muted-foreground">
                  {s.weight.toFixed(2)}
                </td>
                <td className="px-2 py-1 text-right font-mono tabular-nums">
                  {contribution.toFixed(3)}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border">
            <td className="px-2 py-1.5 font-medium" colSpan={3}>
              Match confidence
            </td>
            <td className="px-2 py-1.5 text-right font-mono text-sm font-semibold tabular-nums">
              {confidence.toFixed(3)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
