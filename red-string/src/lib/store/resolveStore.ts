import { create } from 'zustand'
import * as api from '@/lib/api'
import type { ResolveCards, ResolveOutcome } from '@/lib/api/types'
import { useAuditStore } from './auditStore'
import { useUiStore } from './uiStore'

interface ResolveState {
  cards: ResolveCards | null
  decisions: Record<string, ResolveOutcome>
  loading: boolean
  refresh: () => Promise<void>
  decide: (cardId: string, outcome: ResolveOutcome) => Promise<void>
}

export const useResolveStore = create<ResolveState>((set) => ({
  cards: null,
  decisions: {},
  loading: false,
  refresh: async () => {
    set({ loading: true })
    const { cards, decisions } = await api.getResolveState()
    set({ cards, decisions, loading: false })
  },
  decide: async (cardId, outcome) => {
    // optimistic
    set((s) => ({ decisions: { ...s.decisions, [cardId]: outcome } }))
    await api.decideResolve(cardId, outcome, useUiStore.getState().actor)
    const { decisions } = await api.getResolveState()
    set({ decisions })
    // the decision appended to the custody chain — reflect it live
    useAuditStore.getState().refresh()
  },
}))
