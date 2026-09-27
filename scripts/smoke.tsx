import { JSDOM } from 'jsdom'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
})
// @ts-expect-error test shim
globalThis.window = dom.window
// @ts-expect-error test shim
globalThis.document = dom.window.document
globalThis.HTMLElement = dom.window.HTMLElement
// @ts-expect-error test shim
globalThis.SVGElement = dom.window.SVGElement

const { AppShell } = await import('../src/components/layout/AppShell')
const { DashboardPage } = await import('../src/pages/DashboardPage')
const { ResolvePage } = await import('../src/pages/ResolvePage')
const { IngestPage } = await import('../src/pages/IngestPage')
const { EvidencePage } = await import('../src/pages/EvidencePage')
const { TrustPage } = await import('../src/pages/TrustPage')
const { ReportPage } = await import('../src/pages/ReportPage')
const api = await import('../src/lib/api')

function render(node: React.ReactElement, name: string) {
  try {
    const html = renderToString(node)
    console.log(`  ok   ${name}  (${html.length} chars)`)
  } catch (e) {
    console.error(`  FAIL ${name}:`, (e as Error).message)
    process.exitCode = 1
  }
}

const shell = (el: React.ReactElement) =>
  React.createElement(
    MemoryRouter,
    null,
    React.createElement(
      Routes,
      null,
      React.createElement(Route, {
        path: '*',
        element: React.createElement(AppShell, null, el),
      }),
    ),
  )

console.log('render smoke:')
render(shell(React.createElement(DashboardPage)), 'DashboardPage')
render(shell(React.createElement(ResolvePage)), 'ResolvePage')
render(shell(React.createElement(IngestPage)), 'IngestPage')
render(shell(React.createElement(EvidencePage)), 'EvidencePage')
render(shell(React.createElement(TrustPage)), 'TrustPage')
render(
  React.createElement(
    MemoryRouter,
    { initialEntries: ['/report/p_rahul'] },
    React.createElement(
      Routes,
      null,
      React.createElement(Route, { path: '/report/:entityId', element: React.createElement(ReportPage) }),
    ),
  ),
  'ReportPage',
)

console.log('\napi smoke:')
const g = await api.getGraph()
console.log(`  graph: ${g.nodes.length} nodes, ${g.edges.length} edges`)
const rahul = await api.getEntity('p_rahul')
console.log(`  p_rahul: score ${rahul.node.priority_score}, ${rahul.fired.length} heuristics, ${rahul.counts.connections} connections`)
const { cards, decisions: d0 } = await api.getResolveState()
console.log(
  `  resolve: ${cards.merge.length} merge / ${cards.refuse.length} refuse / ${cards.review.length} review · ${Object.keys(d0).length} decided`,
)
await api.decideResolve('rc_merge_rsharma', 'merge_confirmed')
await api.decideResolve('rc_merge_rsharma', 'merge_confirmed') // idempotent — no second log
const auditAfter = await api.getCustodyLog()
const { decisions: d1 } = await api.getResolveState()
console.log(
  `  after decide x2: ${Object.keys(d1).length} decided, custody entries ${auditAfter.length} (was 10)`,
)
const log = await api.getCustodyLog()
const v = await api.verifyCustodyChain()
console.log(`  chain: ${log.length} entries, ok=${v.ok}, root=${v.root.slice(0, 12)}`)
const seq = await api.tamperCustodyChain()
const v2 = await api.verifyCustodyChain()
console.log(`  after tamper @${seq}: ok=${v2.ok}, brokenAt=${v2.brokenAt}`)
await api.resetTamper()
const rep = await api.getReportPayload('p_rahul')
console.log(
  `  report: subject ${rep.subject.label}, ${rep.relationships.length} rels, ${rep.financial_flows.length} flows, ${rep.evidence.length} evidence, ${rep.fired_heuristics.length} heuristics, actor ${rep.actor}`,
)
console.log(
  `  report flow channels: ${rep.financial_flows.map((f) => f.channel).join(', ')}; manifest hashes content: ${rep.hash_manifest[0]?.hash.slice(0, 10)}…`,
)
const beforeReportLog = (await api.getCustodyLog()).length
await api.logReportGenerated(rep.case_id, rep.subject.label)
await api.logReportGenerated(rep.case_id, rep.subject.label)
console.log(
  `  logReportGenerated x2 → custody ${beforeReportLog} → ${(await api.getCustodyLog()).length} (getReportPayload itself logs nothing)`,
)
console.log('\ndone.')
