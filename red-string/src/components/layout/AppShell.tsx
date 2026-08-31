import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useGraphStore } from '@/lib/store/graphStore'
import { useAuditStore } from '@/lib/store/auditStore'
import { useResolveStore } from '@/lib/store/resolveStore'
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer'
import { EntityPanel } from '@/features/entity/EntityPanel'

const TITLES: Record<string, string> = {
  '/': 'Case dashboard',
  '/ingest': 'Ingest — collect & process sources',
  '/resolve': 'Resolve — identity resolution queue',
  '/evidence': 'Evidence explorer',
  '/trust': 'Trust — custody hash-chain',
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const refreshGraph = useGraphStore((s) => s.refresh)
  const refreshAudit = useAuditStore((s) => s.refresh)
  const refreshResolve = useResolveStore((s) => s.refresh)

  useEffect(() => {
    refreshGraph()
    refreshAudit()
    refreshResolve()
  }, [refreshGraph, refreshAudit, refreshResolve])

  const title =
    TITLES[pathname] ?? (pathname.startsWith('/report') ? 'Court-ready report' : 'red.string')

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
      <EntityPanel />
      <EvidenceDrawer />
    </div>
  )
}
