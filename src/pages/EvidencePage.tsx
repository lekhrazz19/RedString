import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import * as api from '@/lib/api'
import type { EvidenceRecord } from '@/lib/api/types'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDateTime } from '@/lib/utils'
import { useUiStore } from '@/lib/store/uiStore'

export function EvidencePage() {
  const [records, setRecords] = useState<EvidenceRecord[]>([])
  const [q, setQ] = useState('')
  const openEvidence = useUiStore((s) => s.openEvidence)

  useEffect(() => {
    api.listEvidence().then(setRecords)
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return records
    return records.filter(
      (r) =>
        r.id.toLowerCase().includes(needle) ||
        r.title.toLowerCase().includes(needle) ||
        r.verbatim_text.toLowerCase().includes(needle),
    )
  }, [records, q])

  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-3 flex items-center gap-2">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search records, text, IDs…"
            className="pl-8"
          />
        </div>
        <span className="text-[11px] text-muted-foreground">
          {filtered.length} / {records.length} source records
        </span>
      </div>

      <ScrollArea className="min-h-0 flex-1 rounded-lg border border-border">
        <div className="divide-y divide-border">
          {filtered.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => openEvidence(r.id)}
              className="flex w-full flex-col gap-1 px-3 py-2.5 text-left transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-primary">{r.id}</span>
                <Badge variant="outline" className="text-[9px]">
                  {r.source_type}
                </Badge>
                <span className="text-xs font-medium">{r.title}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {formatDateTime(r.timestamp)}
                </span>
              </div>
              <p className="line-clamp-2 text-[11px] text-muted-foreground">{r.verbatim_text}</p>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
