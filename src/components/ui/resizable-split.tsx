import { useCallback, useRef, useState } from 'react'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  left: React.ReactNode
  right: React.ReactNode
  /** localStorage key to remember the split (per browser) */
  storageKey?: string
  /** right-pane width as a % of the container on first load */
  initialRightPct?: number
  minLeftPx?: number
  minRightPx?: number
  className?: string
}

/** Dependency-free horizontal splitter with a draggable divider. */
export function ResizableSplit({
  left,
  right,
  storageKey,
  initialRightPct = 26,
  minLeftPx = 360,
  minRightPx = 190,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const [rightPct, setRightPct] = useState<number>(() => {
    if (storageKey) {
      try {
        const v = Number(localStorage.getItem(storageKey))
        if (Number.isFinite(v) && v >= 8 && v <= 80) return v
      } catch {
        /* private mode / disabled storage — fall through */
      }
    }
    return initialRightPct
  })

  const apply = useCallback(
    (clientX: number) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const rightPx = Math.min(
        Math.max(rect.right - clientX, minRightPx),
        Math.max(rect.width - minLeftPx, minRightPx),
      )
      setRightPct((rightPx / rect.width) * 100)
    },
    [minLeftPx, minRightPx],
  )

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) apply(e.clientX)
  }
  const endDrag = (e: React.PointerEvent) => {
    if (!dragging.current) return
    dragging.current = false
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, String(Math.round(rightPct)))
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div ref={containerRef} className={cn('flex h-full w-full', className)}>
      <div className="min-w-0 flex-1">{left}</div>
      <div
        role="separator"
        aria-orientation="vertical"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="group relative flex w-3 shrink-0 cursor-col-resize touch-none select-none items-center justify-center"
      >
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors group-hover:bg-primary/50" />
        <div className="z-10 flex h-7 w-3 items-center justify-center rounded-sm border border-border bg-card">
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
      <div className="min-w-0 shrink-0" style={{ width: `${rightPct}%` }}>
        {right}
      </div>
    </div>
  )
}
