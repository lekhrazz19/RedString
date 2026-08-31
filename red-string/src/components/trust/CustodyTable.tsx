import type { AuditEvent } from '@/lib/api/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime, shortHash } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function CustodyTable({
  log,
  brokenAt,
  tamperSeq,
}: {
  log: AuditEvent[]
  brokenAt: number | null
  tamperSeq: number | null
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead className="w-32">Action</TableHead>
          <TableHead>Target</TableHead>
          <TableHead className="w-36">Actor</TableHead>
          <TableHead className="w-36">Timestamp</TableHead>
          <TableHead className="w-40">Entry hash</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {log.map((e) => {
          const broken = brokenAt !== null && e.seq >= brokenAt
          const isTamperRow = tamperSeq === e.seq
          return (
            <TableRow
              key={e.seq}
              className={cn(broken && 'bg-string/10', isTamperRow && 'bg-string/20')}
            >
              <TableCell className="font-mono text-muted-foreground">{e.seq}</TableCell>
              <TableCell>
                <span className="font-mono text-[10px]">{e.action}</span>
              </TableCell>
              <TableCell className="max-w-[280px] truncate">{e.target}</TableCell>
              <TableCell className="font-mono text-[10px] text-muted-foreground">
                {e.actor}
              </TableCell>
              <TableCell className="text-[10px] text-muted-foreground">
                {formatDateTime(e.timestamp)}
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    'font-mono text-[10px]',
                    broken ? 'text-string' : 'text-muted-foreground',
                  )}
                >
                  {shortHash(e.entry_hash ?? '', 8, 6)}
                  {isTamperRow && ' ⚠'}
                </span>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
