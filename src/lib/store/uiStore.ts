import { create } from 'zustand'

export type GraphView = 'projection' | 'full'
export type HighlightMode = 'none' | 'imei' | 'money'

/** demo time span, ms epoch — edges outside [start,end] are dimmed */
export const TIME_MIN = Date.parse('2026-01-01')
export const TIME_MAX = Date.parse('2026-03-31')

interface UiState {
  selectedEntityId: string | null
  evidenceId: string | null
  graphView: GraphView
  highlight: HighlightMode
  timeEnd: number
  actor: string

  selectEntity: (id: string | null) => void
  openEvidence: (id: string | null) => void
  setGraphView: (v: GraphView) => void
  setHighlight: (h: HighlightMode) => void
  setTimeEnd: (t: number) => void
}

export const useUiStore = create<UiState>((set) => ({
  selectedEntityId: null,
  evidenceId: null,
  graphView: 'projection',
  highlight: 'none',
  timeEnd: TIME_MAX,
  actor: 'insp.rao@ncrb',

  selectEntity: (id) => set({ selectedEntityId: id }),
  openEvidence: (id) => set({ evidenceId: id }),
  setGraphView: (v) => set(v === 'projection' ? { graphView: v, highlight: 'none' } : { graphView: v }),
  setHighlight: (h) =>
    set((s) => {
      const next = s.highlight === h ? 'none' : h
      // IMEI / money-path highlights need the heterogeneous layer
      const graphView = next === 'none' ? s.graphView : 'full'
      return { highlight: next, graphView }
    }),
  setTimeEnd: (t) => set({ timeEnd: t }),
}))
