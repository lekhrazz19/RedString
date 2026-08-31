import { AlertTriangle } from 'lucide-react'
import type { Extraction } from './parsers/csv'
import { CONFIDENCE_THRESHOLD } from './parsers/csv'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function ExtractionTable({ rows }: { rows: Extraction[] }) {
  const below = rows.filter((r) => r.confidence < CONFIDENCE_THRESHOLD).length

  return (
    <div>
      <div className="mb-2 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span>{rows.length} entities extracted</span>
        {below > 0 && (
          <span className="flex items-center gap-1 text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            {below} below confidence threshold — flagged, not dropped
          </span>
        )}
      </div>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Value</TableHead>
              <TableHead className="w-24">Type</TableHead>
              <TableHead className="w-28">Method</TableHead>
              <TableHead className="w-28 text-right">Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const low = r.confidence < CONFIDENCE_THRESHOLD
              return (
                <TableRow key={r.key} className={cn(low && 'bg-amber-500/5')}>
                  <TableCell className="font-mono text-[11px]">{r.value}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px]">
                      {r.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">{r.method}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        'font-mono text-[11px] tabular-nums',
                        low ? 'text-amber-400' : 'text-emerald-400',
                      )}
                    >
                      {r.confidence.toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
