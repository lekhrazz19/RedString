import { useEffect, useState } from 'react'
import { Quote } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import * as api from '@/lib/api'
import type { EvidenceRecord } from '@/lib/api/types'
import { formatDateTime } from '@/lib/utils'
import { useUiStore } from '@/lib/store/uiStore'

export function EvidenceDrawer() {
  const evidenceId = useUiStore((s) => s.evidenceId)
  const openEvidence = useUiStore((s) => s.openEvidence)
  const selectEntity = useUiStore((s) => s.selectEntity)
  const [record, setRecord] = useState<EvidenceRecord | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!evidenceId) return
    setLoading(true)
    api.getEvidence(evidenceId).then((r) => {
      setRecord(r ?? null)
      setLoading(false)
    })
  }, [evidenceId])

  return (
    <Sheet open={!!evidenceId} onOpenChange={(o) => !o && openEvidence(null)}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <div className="flex items-center gap-2">
            <SheetTitle className="font-mono">{evidenceId}</SheetTitle>
            {record && (
              <Badge variant="outline" className="text-[10px]">
                {record.source_type}
              </Badge>
            )}
          </div>
          {record && <p className="text-xs text-muted-foreground">{record.title}</p>}
        </SheetHeader>

        <ScrollArea className="flex-1">
          {loading || !record ? (
            <div className="p-4 text-xs text-muted-foreground">Loading source record…</div>
          ) : (
            <div className="space-y-4 p-4">
              <div className="rounded-md border border-border bg-secondary/40 p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  <Quote className="h-3 w-3" />
                  Verbatim source text
                </div>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
                  {record.verbatim_text}
                </p>
              </div>

              <div>
                <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Structured fields
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  {Object.entries(record.fields).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-mono text-[11px]">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <Separator />
              <div>
                <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Recorded {formatDateTime(record.timestamp)}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {record.entities.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => {
                        if (e.startsWith('p_')) {
                          selectEntity(e)
                          openEvidence(null)
                        }
                      }}
                      className="rounded border border-border bg-secondary/60 px-1.5 py-0.5 font-mono text-[10px] hover:border-primary hover:text-primary"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
