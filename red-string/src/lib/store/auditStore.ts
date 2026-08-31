import { create } from 'zustand'
import * as api from '@/lib/api'
import type { AuditEvent, ChainVerification } from '@/lib/api/types'

interface AuditState {
  log: AuditEvent[]
  verification: ChainVerification | null
  tamperSeq: number | null
  busy: boolean
  refresh: () => Promise<void>
  verify: () => Promise<void>
  tamper: () => Promise<void>
  resetTamper: () => Promise<void>
}

export const useAuditStore = create<AuditState>((set) => ({
  log: [],
  verification: null,
  tamperSeq: null,
  busy: false,
  refresh: async () => {
    const log = await api.getCustodyLog()
    set({ log })
  },
  verify: async () => {
    set({ busy: true })
    const verification = await api.verifyCustodyChain()
    set({ verification, busy: false })
  },
  tamper: async () => {
    set({ busy: true })
    const seq = await api.tamperCustodyChain()
    const log = await api.getCustodyLog()
    const verification = await api.verifyCustodyChain()
    set({ tamperSeq: seq, log, verification, busy: false })
  },
  resetTamper: async () => {
    await api.resetTamper()
    const log = await api.getCustodyLog()
    set({ tamperSeq: null, verification: null, log })
  },
}))
