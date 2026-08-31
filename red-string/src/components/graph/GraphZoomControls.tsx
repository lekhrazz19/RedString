import { Maximize, Minus, Plus, RotateCcw } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface Props {
  zoom: number
  min: number
  max: number
  onZoom: (level: number) => void
  onFit: () => void
  onReset: () => void
}

export function GraphZoomControls({ zoom, min, max, onZoom, onFit, onReset }: Props) {
  return (
    <div className="no-print absolute bottom-3 right-3 flex items-center gap-1 rounded-md border border-border bg-card/90 px-1.5 py-1 backdrop-blur">
      <IconBtn label="Zoom out" onClick={() => onZoom(zoom / 1.3)} disabled={zoom <= min + 1e-3}>
        <Minus className="h-3.5 w-3.5" />
      </IconBtn>
      <Slider
        value={[zoom]}
        min={min}
        max={max}
        step={0.02}
        onValueChange={([v]) => onZoom(v)}
        className="w-24"
        aria-label="Zoom level"
      />
      <IconBtn label="Zoom in" onClick={() => onZoom(zoom * 1.3)} disabled={zoom >= max - 1e-3}>
        <Plus className="h-3.5 w-3.5" />
      </IconBtn>
      <span className="w-9 shrink-0 text-center font-mono text-[10px] tabular-nums text-muted-foreground">
        {Math.round(zoom * 100)}%
      </span>
      <div className="mx-0.5 h-4 w-px bg-border" />
      <IconBtn label="Fit graph to view" onClick={onFit}>
        <Maximize className="h-3.5 w-3.5" />
      </IconBtn>
      <IconBtn label="Reset zoom to 100%" onClick={onReset}>
        <RotateCcw className="h-3.5 w-3.5" />
      </IconBtn>
    </div>
  )
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40',
      )}
    >
      {children}
    </button>
  )
}
