import { NavLink } from 'react-router-dom'
import {
  FileInput,
  GitCompareArrows,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/ingest', label: 'Ingest', icon: FileInput },
  { to: '/resolve', label: 'Resolve', icon: GitCompareArrows },
  { to: '/evidence', label: 'Evidence', icon: ScrollText },
  { to: '/trust', label: 'Trust chain', icon: ShieldCheck },
]

export function Sidebar() {
  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-card/40">
      <div className="flex h-12 items-center gap-2 border-b border-border px-4">
        <KnotGlyph />
        <span className="font-mono text-sm font-semibold tracking-tight">
          red<span className="text-string">.</span>string
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          SIH26189 · NCRB Women Safety Division
          <br />
          Prototype · synthetic data · human-in-the-loop
        </p>
      </div>
    </aside>
  )
}

function KnotGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="4" cy="4" r="2.4" fill="#ef4444" />
      <circle cx="14" cy="6" r="2.4" fill="#ef4444" />
      <circle cx="8" cy="14" r="2.4" fill="#ef4444" />
      <path
        d="M4 4L14 6L8 14L4 4Z"
        stroke="#ef4444"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  )
}
