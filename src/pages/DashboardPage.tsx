import { CytoscapeGraph } from '@/components/graph/CytoscapeGraph'
import { GraphLegend } from '@/components/graph/GraphLegend'
import { ResizableSplit } from '@/components/ui/resizable-split'
import { StatCounters } from '@/features/dashboard/StatCounters'
import { GraphControls } from '@/features/dashboard/GraphControls'
import { PriorityList } from '@/features/dashboard/PriorityList'
import { useGraphStore } from '@/lib/store/graphStore'
import { useUiStore } from '@/lib/store/uiStore'

export function DashboardPage() {
  const graph = useGraphStore((s) => s.graph)
  const { graphView, highlight, timeEnd, selectedEntityId, selectEntity } = useUiStore()

  if (!graph) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Loading case graph…
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <StatCounters graph={graph} />
      <GraphControls />
      <div className="min-h-0 flex-1">
        <ResizableSplit
          storageKey="rs-dashboard-split"
          left={
            <div className="relative h-full overflow-hidden rounded-lg border border-border bg-card">
              <CytoscapeGraph
                graph={graph}
                view={graphView}
                highlight={highlight}
                timeEnd={timeEnd}
                selectedId={selectedEntityId}
                onSelect={selectEntity}
              />
              <GraphLegend view={graphView} />
            </div>
          }
          right={<PriorityList graph={graph} />}
        />
      </div>
    </div>
  )
}
