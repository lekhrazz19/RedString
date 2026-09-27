import { create } from 'zustand'
import * as api from '@/lib/api'
import type { GraphSchema } from '@/lib/api/types'

interface GraphState {
  graph: GraphSchema | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  reset: () => Promise<void>
}

export const useGraphStore = create<GraphState>((set) => ({
  graph: null,
  loading: false,
  error: null,
  refresh: async () => {
    set({ loading: true, error: null })
    try {
      const graph = await api.getGraph()
      set({ graph, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },
  reset: async () => {
    set({ loading: true })
    await api.resetDemo()
    const graph = await api.getGraph()
    set({ graph, loading: false })
  },
}))
