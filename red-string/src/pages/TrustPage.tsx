import { useEffect } from 'react'
import { CheckCircle2, ShieldAlert, ShieldCheck, FlaskConical, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CustodyTable } from '@/components/trust/CustodyTable'
import { useAuditStore } from '@/lib/store/auditStore'
import { shortHash, cn } from '@/lib/utils'

export function TrustPage() {
  const { log, verification, tamperSeq, busy, refresh, verify, tamper, resetTamper } =
    useAuditStore()

  useEffect(() => {
    refresh()
  }, [refresh])

  const status = verification
    ? verification.ok
      ? 'intact'
      : 'broken'
    : 'unchecked'

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <Card
        className={cn(
          'flex items-center gap-4 p-3',
          status === 'intact' && 'border-emerald-500/40',
          status === 'broken' && 'border-string/50',
        )}
      >
        <div className="flex items-center gap-2.5">
          {status === 'intact' && <ShieldCheck className="h-6 w-6 text-emerald-400" />}
          {status === 'broken' && <ShieldAlert className="h-6 w-6 text-string" />}
          {status === 'unchecked' && <ShieldCheck className="h-6 w-6 text-muted-foreground" />}
          <div>
            <div className="text-sm font-semibold">
              {status === 'intact' && 'Chain intact'}
              {status === 'broken' && `Chain BROKEN at entry #${verification?.brokenAt}`}
              {status === 'unchecked' && 'Custody chain not yet verified'}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              SHA-256 hash-chain · {log.length} entries
              {verification && ` · root ${shortHash(verification.root, 10, 8)}`}
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="gap-1.5" onClick={verify} disabled={busy}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verify chain
          </Button>
          <Button
            size="sm"
            variant="string"
            className="gap-1.5"
            onClick={tamper}
            disabled={busy || tamperSeq !== null}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Tamper (demo)
          </Button>
          {tamperSeq !== null && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={resetTamper}>
              <RotateCcw className="h-3.5 w-3.5" />
              Restore
            </Button>
          )}
        </div>
      </Card>

      {tamperSeq !== null && (
        <p className="rounded-md border border-string/30 bg-string/5 px-3 py-2 text-[11px] text-foreground/90">
          One byte was flipped in entry <span className="font-mono">#{tamperSeq}</span> without
          recomputing its hash. Every entry from that point forward now fails re-verification — the
          tamper is localised and undeniable.
        </p>
      )}

      <ScrollArea className="min-h-0 flex-1 rounded-lg border border-border">
        <CustodyTable
          log={log}
          brokenAt={verification?.ok === false ? verification.brokenAt : null}
          tamperSeq={tamperSeq}
        />
      </ScrollArea>
    </div>
  )
}
