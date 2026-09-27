import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, ArrowUpRight } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EvidenceRef, EvidenceRefList } from '@/components/evidence/EvidenceRef'
import * as api from '@/lib/api'
import type { EntityDetail } from '@/lib/api'
import { useUiStore } from '@/lib/store/uiStore'
import { useAuditStore } from '@/lib/store/auditStore'
import { priorityBand, communityColor } from '@/lib/graph/theme'
import { cn } from '@/lib/utils'
import { ConnectionBreakdown } from './ConnectionBreakdown'
import { WhyFlaggedPanel } from './WhyFlaggedPanel'

export function EntityPanel() {
  const selectedEntityId = useUiStore((s) => s.selectedEntityId)
  const selectEntity = useUiStore((s) => s.selectEntity)
  const actor = useUiStore((s) => s.actor)
  const refreshAudit = useAuditStore((s) => s.refresh)
  const navigate = useNavigate()
  const [detail, setDetail] = useState<EntityDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const viewed = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!selectedEntityId) return
    setLoading(true)
    setDetail(null)
    api.getEntity(selectedEntityId).then(async (d) => {
      setDetail(d)
      setLoading(false)
      if (d.node.type === 'PERSON' && !viewed.current.has(d.node.id)) {
        viewed.current.add(d.node.id)
        await api.appendAudit({ action: 'VIEW_ENTITY', actor, target: d.node.label })
        refreshAudit()
      }
    })
  }, [selectedEntityId, actor, refreshAudit])

  const node = detail?.node
  const band = priorityBand(node?.priority_score)

  return (
    <Sheet open={!!selectedEntityId} onOpenChange={(o) => !o && selectEntity(null)}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border">
          {loading || !node ? (
            <SheetTitle className="text-sm text-muted-foreground">Loading entity…</SheetTitle>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <SheetTitle>{node.label}</SheetTitle>
                <Badge variant="outline" className="text-[10px]">
                  {node.type}
                </Badge>
                {node.priority_score !== undefined && node.priority_score > 0 && (
                  <Badge variant={band.badge} className="text-[10px]">
                    {band.label} · {node.priority_score.toFixed(1)}
                  </Badge>
                )}
                {node.rank && (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    rank #{node.rank}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {node.community !== undefined && (
                  <span className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: communityColor(node.community) }}
                    />
                    community {node.community}
                  </span>
                )}
                {node.aliases?.length ? <span>aka {node.aliases.join(' · ')}</span> : null}
              </div>
              {typeof node.meta?.role === 'string' && (
                <p className="text-[11px] text-foreground/80">{node.meta.role}</p>
              )}
            </>
          )}
        </SheetHeader>

        {node && detail && (
          <>
            <div className="border-b border-border p-4">
              <ConnectionBreakdown counts={detail.counts} />
            </div>

            <Tabs defaultValue="why" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="mx-4 mt-3 w-fit">
                <TabsTrigger value="why">Why flagged?</TabsTrigger>
                <TabsTrigger value="connections">Connections</TabsTrigger>
                <TabsTrigger value="evidence">Evidence</TabsTrigger>
              </TabsList>

              <ScrollArea className="min-h-0 flex-1">
                <div className="p-4">
                  <TabsContent value="why" className="mt-0">
                    <WhyFlaggedPanel node={node} fired={detail.fired} />
                  </TabsContent>

                  <TabsContent value="connections" className="mt-0 space-y-1.5">
                    {detail.neighbours.length === 0 && (
                      <p className="text-xs text-muted-foreground">No person-level associations.</p>
                    )}
                    {detail.neighbours.map((n) => (
                      <div
                        key={n.node.id}
                        className="rounded-md border border-border p-2"
                      >
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            className="flex items-center gap-1.5 text-xs font-medium hover:text-primary"
                            onClick={() => selectEntity(n.node.id)}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: communityColor(n.node.community) }}
                            />
                            {n.node.label}
                            <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                          </button>
                          <div className="flex items-center gap-2">
                            {n.edge.suspicious && (
                              <Badge variant="string" className="text-[9px]">
                                suspicious
                              </Badge>
                            )}
                            <span className="font-mono text-[10px] text-muted-foreground">
                              w {n.edge.weight.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              n.edge.suspicious ? 'bg-string' : 'bg-primary',
                            )}
                            style={{ width: `${n.edge.weight * 100}%` }}
                          />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            {n.edge.event_count} events · first seen {n.edge.first_seen}
                          </span>
                          <EvidenceRefList ids={n.edge.evidence_ids} />
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="evidence" className="mt-0 space-y-1.5">
                    {detail.evidence.length === 0 && (
                      <p className="text-xs text-muted-foreground">No linked source records.</p>
                    )}
                    {detail.evidence.map((ev) => (
                      <div key={ev.id} className="rounded-md border border-border p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{ev.title}</span>
                          <EvidenceRef id={ev.id} />
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                          {ev.verbatim_text}
                        </p>
                      </div>
                    ))}
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>

            {node.type === 'PERSON' && (
              <div className="border-t border-border p-3">
                <Button
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => {
                    selectEntity(null)
                    navigate(`/report/${node.id}`)
                  }}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Open court-ready report
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
