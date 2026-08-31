import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape'
import fcose from 'cytoscape-fcose'
import type { GraphSchema } from '@/lib/api/types'
import type { GraphView, HighlightMode } from '@/lib/store/uiStore'
import { communityColor, ENTITY_META, priorityBand } from '@/lib/graph/theme'
import { GraphZoomControls } from './GraphZoomControls'

cytoscape.use(fcose)

const SHARED_IMEI = '35-991172-887761-3'
export const MIN_ZOOM = 0.2
export const MAX_ZOOM = 2.5
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

interface Props {
  graph: GraphSchema
  view: GraphView
  highlight: HighlightMode
  timeEnd: number
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function CytoscapeGraph({
  graph,
  view,
  highlight,
  timeEnd,
  selectedId,
  onSelect,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)
  const [zoom, setZoom] = useState(1)

  // keep the latest onSelect without re-initialising cytoscape
  const onSelectRef = useRef(onSelect)
  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  const elements = useMemo(() => buildElements(graph, view), [graph, view])

  const zoomTo = useCallback((level: number, animate = true) => {
    const cy = cyRef.current
    if (!cy) return
    const opts = {
      level: clampZoom(level),
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    }
    if (animate) cy.animate({ zoom: opts }, { duration: 120 })
    else cy.zoom(opts)
  }, [])

  const fit = useCallback(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.animate({ fit: { eles: cy.elements(), padding: 40 } }, { duration: 150 })
  }, [])

  // init once
  useEffect(() => {
    if (!boxRef.current) return
    const cy = cytoscape({
      container: boxRef.current,
      elements: [],
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      style: STYLE,
    })
    cyRef.current = cy
    setZoom(cy.zoom())
    cy.on('tap', 'node', (e) => onSelectRef.current(e.target.id()))
    cy.on('tap', (e) => {
      if (e.target === cy) onSelectRef.current(null)
    })
    cy.on('zoom', () => setZoom(cy.zoom()))

    const box = boxRef.current
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
      if (e.key === '+' || e.key === '=') zoomTo(cy.zoom() * 1.3)
      else if (e.key === '-' || e.key === '_') zoomTo(cy.zoom() / 1.3)
      else if (e.key === '0') fit()
    }
    box.addEventListener('keydown', onKey)

    // keep the canvas correct when its panel is resized
    let raf = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => cy.resize())
    })
    ro.observe(box)

    return () => {
      box.removeEventListener('keydown', onKey)
      cancelAnimationFrame(raf)
      ro.disconnect()
      cy.destroy()
      cyRef.current = null
    }
  }, [zoomTo, fit])

  // elements + layout
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.batch(() => {
      cy.elements().remove()
      cy.add(elements)
    })
    const layout = cy.layout({
      name: 'fcose',
      quality: 'default',
      animate: false,
      nodeRepulsion: 9000,
      idealEdgeLength: (edge: cytoscape.EdgeSingular) =>
        70 + (1 - (edge.data('weight') ?? 0.5)) * 90,
      nodeSeparation: 90,
      padding: 30,
    } as cytoscape.LayoutOptions)
    layout.run()
  }, [elements])

  // decorations: time filter + highlight + selection
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.batch(() => {
      cy.elements().removeClass('dim faded focus path-hit selected')

      // time filter
      cy.edges().forEach((edge) => {
        const first = Date.parse(edge.data('first_seen'))
        if (Number.isFinite(first) && first > timeEnd) edge.addClass('faded')
      })
      cy.nodes().forEach((n) => {
        const visibleDeg = n
          .connectedEdges()
          .filter((e) => !e.hasClass('faded')).length
        if (visibleDeg === 0 && n.degree(false) > 0) n.addClass('faded')
      })

      // highlight modes
      if (highlight === 'imei') {
        const hitPhones = cy
          .nodes('[type = "PHONE"]')
          .filter((n) => n.data('imei') === SHARED_IMEI)
        let hit = hitPhones
        hitPhones.forEach((p) => {
          const owner = cy.getElementById(String(p.data('owner')))
          if (owner.nonempty()) hit = hit.union(owner)
        })
        if (hit.nonempty()) {
          cy.elements().addClass('dim')
          hit.removeClass('dim').addClass('focus')
          hit.edgesWith(hit).removeClass('dim').addClass('path-hit')
        }
      } else if (highlight === 'money') {
        const flowEdges = cy
          .edges('[type = "TRANSFERRED_TO"]')
          .filter((e) => !e.hasClass('faded'))
        if (flowEdges.nonempty()) {
          cy.elements().addClass('dim')
          flowEdges.connectedNodes().removeClass('dim').addClass('focus')
          flowEdges.removeClass('dim').addClass('path-hit')
        }
      }

      if (selectedId) {
        const sel = cy.getElementById(selectedId)
        if (sel.nonempty()) {
          sel.addClass('selected')
          sel.neighborhood().removeClass('dim')
          sel.addClass('focus')
        }
      }
    })
  }, [highlight, timeEnd, selectedId, elements])

  return (
    <div className="relative h-full w-full">
      <div ref={boxRef} tabIndex={0} className="h-full w-full outline-none" />
      <GraphZoomControls
        zoom={zoom}
        min={MIN_ZOOM}
        max={MAX_ZOOM}
        onZoom={(level) => zoomTo(level, false)}
        onFit={fit}
        onReset={() => {
          const cy = cyRef.current
          if (!cy) return
          cy.animate({ zoom: 1, center: { eles: cy.elements() } }, { duration: 150 })
        }}
      />
    </div>
  )
}

function buildElements(graph: GraphSchema, view: GraphView): ElementDefinition[] {
  const isProjection = view === 'projection'
  const keepEdgeTypes = isProjection
    ? new Set(['ASSOCIATED_WITH', 'SAME_AS'])
    : new Set(['OWNS', 'CALLED', 'TRANSFERRED_TO', 'LOCATED_AT', 'MENTIONED_IN', 'MET', 'SAME_AS'])

  const edges = graph.edges.filter((e) => keepEdgeTypes.has(e.type))
  const used = new Set<string>()
  edges.forEach((e) => {
    used.add(e.source)
    used.add(e.target)
  })

  const nodes = graph.nodes.filter((n) => {
    if (isProjection) return n.type === 'PERSON'
    return used.has(n.id) || n.type === 'PERSON'
  })

  const nodeEls: ElementDefinition[] = nodes.map((n) => {
    const band = priorityBand(n.priority_score)
    return {
      data: {
        id: n.id,
        label: n.label,
        type: n.type,
        community: n.community ?? -1,
        color:
          n.type === 'PERSON' ? communityColor(n.community) : ENTITY_META[n.type].color,
        priority: n.priority_score ?? 0,
        high: n.priority_score !== undefined && n.priority_score >= 7 ? 1 : 0,
        band: band.label,
        size:
          n.type === 'PERSON'
            ? 26 + Math.min(28, (n.priority_score ?? 0) * 3)
            : 16,
        owner: n.meta?.owner ?? '',
        imei: n.meta?.imei ?? '',
        ingested: n.ingested ? 1 : 0,
      },
    }
  })

  const nodeIds = new Set(nodes.map((n) => n.id))
  const edgeEls: ElementDefinition[] = edges
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map((e) => ({
      data: {
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
        weight: e.weight,
        suspicious: e.suspicious ? 1 : 0,
        first_seen: e.first_seen,
        width: e.type === 'ASSOCIATED_WITH' ? 1 + e.weight * 5 : 1.6,
      },
    }))

  return [...nodeEls, ...edgeEls]
}

const STYLE: cytoscape.StylesheetJson = [
  {
    selector: 'node',
    style: {
      'background-color': 'data(color)',
      width: 'data(size)',
      height: 'data(size)',
      label: 'data(label)',
      color: '#d4d4d8',
      'font-size': 9,
      'font-family': 'Inter, sans-serif',
      'text-valign': 'bottom',
      'text-margin-y': 3,
      'text-max-width': '90px',
      'text-wrap': 'ellipsis',
      'border-width': 0,
      'transition-property': 'opacity, border-width',
      'transition-duration': 120,
    },
  },
  {
    selector: 'node[type != "PERSON"]',
    style: { shape: 'round-rectangle', 'font-size': 7, color: '#a1a1aa' },
  },
  {
    // high priority — red halo + bright hairline, reads against any fill
    selector: 'node[high = 1]',
    style: {
      'border-width': 2,
      'border-color': '#fecaca',
      'underlay-color': '#ef4444',
      'underlay-opacity': 0.4,
      'underlay-padding': 8,
      'underlay-shape': 'ellipse',
    },
  },
  {
    // live-ingested — cyan dashed ring (distinct from selection blue)
    selector: 'node[ingested = 1]',
    style: { 'border-width': 2, 'border-color': '#22d3ee', 'border-style': 'dashed' },
  },
  {
    selector: 'edge',
    style: {
      'curve-style': 'bezier',
      width: 'data(width)',
      'line-color': '#3f3f46',
      'target-arrow-color': '#3f3f46',
      opacity: 0.9,
      'transition-property': 'opacity, line-color',
      'transition-duration': 120,
    },
  },
  {
    selector: 'edge[type = "TRANSFERRED_TO"]',
    style: { 'line-color': '#34d399', 'target-arrow-color': '#34d399', 'target-arrow-shape': 'triangle' },
  },
  { selector: 'edge[type = "CALLED"]', style: { 'line-color': '#38bdf8' } },
  {
    selector: 'edge[type = "OWNS"], edge[type = "LOCATED_AT"], edge[type = "MENTIONED_IN"], edge[type = "SAME_AS"]',
    style: { 'line-style': 'dashed', 'line-color': '#3f3f46', opacity: 0.6 },
  },
  {
    selector: 'edge[suspicious = 1]',
    style: { 'line-color': '#ef4444', 'target-arrow-color': '#ef4444', opacity: 1 },
  },
  { selector: '.dim', style: { opacity: 0.12 } },
  { selector: '.faded', style: { opacity: 0.06 } },
  {
    selector: '.path-hit',
    style: { 'line-color': '#ef4444', 'target-arrow-color': '#ef4444', width: 4, opacity: 1 },
  },
  { selector: 'node.focus', style: { opacity: 1 } },
  {
    // selection — blue overlay glow + bright ring, always on top
    selector: 'node.selected',
    style: {
      'overlay-color': '#3b82f6',
      'overlay-opacity': 0.35,
      'overlay-padding': 12,
      'border-width': 4,
      'border-color': '#93c5fd',
      opacity: 1,
    },
  },
  {
    selector: 'node.selected, node.focus',
    style: {
      color: '#fafafa',
      'text-background-color': '#09090b',
      'text-background-opacity': 0.85,
      'text-background-padding': '2px',
    },
  },
]
