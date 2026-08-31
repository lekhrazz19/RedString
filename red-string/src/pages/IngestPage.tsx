import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FileInput, Upload, Database, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ExtractionTable } from '@/features/ingest/ExtractionTable'
import { parseCsv, type ParsedIngest } from '@/features/ingest/parsers/csv'
import cdrSample from '@/lib/fixtures/raw-samples/cdr_sample.csv?raw'
import txnSample from '@/lib/fixtures/raw-samples/txn_sample.csv?raw'
import * as api from '@/lib/api'
import { useGraphStore } from '@/lib/store/graphStore'
import { useAuditStore } from '@/lib/store/auditStore'
import { useUiStore } from '@/lib/store/uiStore'
import { cn } from '@/lib/utils'

export function IngestPage() {
  const [parsed, setParsed] = useState<ParsedIngest | null>(null)
  const [committed, setCommitted] = useState<{ nodes: number; edges: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const refreshGraph = useGraphStore((s) => s.refresh)
  const refreshAudit = useAuditStore((s) => s.refresh)
  const actor = useUiStore((s) => s.actor)

  const handleText = useCallback((text: string, name: string) => {
    const result = parseCsv(text, name)
    if (result.kind === 'UNKNOWN') {
      toast.error('Unrecognised CSV schema. Expected a CDR or transaction export.')
      return
    }
    setParsed(result)
    setCommitted(null)
  }, [])

  const onFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => handleText(String(reader.result), file.name)
    reader.readAsText(file)
  }

  async function commit() {
    if (!parsed) return
    const res = await api.commitIngest(parsed.nodes, parsed.edges, parsed.sourceLabel, actor)
    setCommitted({ nodes: res.addedNodes, edges: res.addedEdges })
    await refreshGraph()
    await refreshAudit()
    toast.success(
      `Committed to graph — +${res.addedNodes} entities, +${res.addedEdges} relationships`,
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-xs text-muted-foreground">
          Collect &amp; process data from multiple sources. Regex-first extraction for closed-format
          fields (phones, accounts, IMEI), gazetteer NER for open-format entities (names, places).
          Nothing is committed to the case graph until you confirm.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const f = e.dataTransfer.files[0]
            if (f) onFile(f)
          }}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/40 px-6 py-10 text-center transition-colors',
            dragOver && 'border-primary bg-primary/5',
          )}
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <div className="text-xs">
            Drop a <span className="font-mono">.csv</span> export here, or
          </div>
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <FileInput className="h-3.5 w-3.5" />
            Choose file
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFile(f)
            }}
          />
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              or load a sample
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 gap-1.5 text-[11px]"
              onClick={() => handleText(cdrSample, 'cdr_sample.csv')}
            >
              <Database className="h-3 w-3" />
              CDR export
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 gap-1.5 text-[11px]"
              onClick={() => handleText(txnSample, 'txn_sample.csv')}
            >
              <Database className="h-3 w-3" />
              Transaction dump
            </Button>
          </div>
        </div>

        {parsed && (
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs">
                <span className="font-mono text-primary">{parsed.sourceLabel}</span>
                <span className="text-muted-foreground">
                  {' '}
                  · {parsed.kind} · {parsed.rowCount} rows · {parsed.nodes.length} candidate
                  entities · {parsed.edges.length} candidate relationships
                </span>
              </div>
              {committed ? (
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  +{committed.nodes} entities · +{committed.edges} relationships
                </span>
              ) : (
                <Button size="sm" onClick={commit}>
                  Commit to graph
                </Button>
              )}
            </div>
            <ExtractionTable rows={parsed.extractions} />
            {committed && (
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate('/')}>
                  View updated graph
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  New nodes appear with a dashed blue outline. Logged to the custody chain.
                </span>
              </div>
            )}
          </Card>
        )}
      </div>
    </ScrollArea>
  )
}
