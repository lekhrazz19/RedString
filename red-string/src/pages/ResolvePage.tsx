import { useEffect } from 'react'
import { Ban, GitMerge, HelpCircle } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ResolveCardView } from '@/components/resolve/ResolveCardView'
import { useResolveStore } from '@/lib/store/resolveStore'

export function ResolvePage() {
  const cards = useResolveStore((s) => s.cards)
  const decisions = useResolveStore((s) => s.decisions)
  const refresh = useResolveStore((s) => s.refresh)

  useEffect(() => {
    refresh()
  }, [refresh])

  if (!cards) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Loading resolution queue…
      </div>
    )
  }

  const columns = [
    {
      key: 'merge',
      title: 'Merge',
      icon: GitMerge,
      hint: 'hard identifiers agree — safe & reversible',
      items: cards.merge,
    },
    {
      key: 'refuse',
      title: 'Refuse',
      icon: Ban,
      hint: 'same name, different person — kept separate',
      items: cards.refuse,
    },
    {
      key: 'review',
      title: 'Review',
      icon: HelpCircle,
      hint: 'ambiguous — routed to a human, no guess',
      items: cards.review,
    },
  ] as const

  return (
    <div className="grid h-full grid-cols-3 gap-3 p-3">
      {columns.map((col) => {
        const Icon = col.icon
        return (
          <div key={col.key} className="flex min-h-0 flex-col rounded-lg border border-border bg-card/40">
            <div className="border-b border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-xs font-semibold">{col.title}</h2>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {col.items.length}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">{col.hint}</p>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-3 p-3">
                {col.items.map((c) => (
                  <ResolveCardView key={c.id} card={c} decision={decisions[c.id]} />
                ))}
                {col.items.length === 0 && (
                  <p className="text-[11px] text-muted-foreground">Queue empty.</p>
                )}
              </div>
            </ScrollArea>
          </div>
        )
      })}
    </div>
  )
}
