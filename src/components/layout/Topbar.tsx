import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useGraphStore } from '@/lib/store/graphStore'
import { useAuditStore } from '@/lib/store/auditStore'
import { useResolveStore } from '@/lib/store/resolveStore'
import { useUiStore } from '@/lib/store/uiStore'

export function Topbar({ title }: { title: string }) {
  const graph = useGraphStore((s) => s.graph)
  const resetGraph = useGraphStore((s) => s.reset)
  const refreshAudit = useAuditStore((s) => s.refresh)
  const resetTamper = useAuditStore((s) => s.resetTamper)
  const refreshResolve = useResolveStore((s) => s.refresh)
  const { selectEntity, setHighlight, setTimeEnd } = useUiStore()
  const [resetting, setResetting] = useState(false)

  async function handleReset() {
    setResetting(true)
    selectEntity(null)
    setHighlight('none')
    setTimeEnd(Date.parse('2026-03-31'))
    await resetTamper()
    await resetGraph()
    await refreshAudit()
    await refreshResolve()
    setResetting(false)
  }

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card/40 px-4">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold">{title}</h1>
        {graph && (
          <Badge variant="secondary" className="font-mono text-[10px]">
            {graph.case_id}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-[11px] text-muted-foreground sm:inline">
          {useUiStore.getState().actor}
        </span>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset demo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset the demo state?</DialogTitle>
              <DialogDescription>
                Restores the fixture graph, clears any live-ingested records, resets the custody
                chain and all graph highlights to their initial state. Use this between demo runs.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button size="sm" onClick={handleReset} disabled={resetting}>
                  {resetting ? 'Resetting…' : 'Reset'}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}
