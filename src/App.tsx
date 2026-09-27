import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { IngestPage } from '@/pages/IngestPage'
import { ResolvePage } from '@/pages/ResolvePage'
import { EvidencePage } from '@/pages/EvidencePage'
import { TrustPage } from '@/pages/TrustPage'
import { ReportPage } from '@/pages/ReportPage'

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider delayDuration={200}>
        <Routes>
          <Route path="/report/:entityId" element={<ReportPage />} />
          <Route
            path="*"
            element={
              <AppShell>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/ingest" element={<IngestPage />} />
                  <Route path="/resolve" element={<ResolvePage />} />
                  <Route path="/evidence" element={<EvidencePage />} />
                  <Route path="/trust" element={<TrustPage />} />
                </Routes>
              </AppShell>
            }
          />
        </Routes>
        <Toaster />
      </TooltipProvider>
    </BrowserRouter>
  )
}
