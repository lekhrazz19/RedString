import type { AuditEvent, ChainVerification } from '@/lib/api/types'

/** SHA-256 hex digest of a string, via Web Crypto (browser stdlib). */
export async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const GENESIS = '0'.repeat(64)

function serialize(e: AuditEvent, prevHash: string): string {
  return [prevHash, e.artifact_hash, e.action, e.actor, e.timestamp].join('|')
}

/**
 * Recompute entry_hash for every event in order.
 * entry_i = SHA256(entry_{i-1}.hash ‖ artifact_hash ‖ action ‖ actor ‖ timestamp)
 */
export async function buildChain(events: AuditEvent[]): Promise<AuditEvent[]> {
  const out: AuditEvent[] = []
  let prev = GENESIS
  for (const e of events) {
    const entry_hash = await sha256(serialize(e, prev))
    out.push({ ...e, entry_hash })
    prev = entry_hash
  }
  return out
}

/**
 * Walk the chain and confirm each stored entry_hash still matches a fresh
 * recomputation. Returns the first sequence where it diverges, if any.
 */
export async function verifyChain(events: AuditEvent[]): Promise<ChainVerification> {
  let prev = GENESIS
  let brokenAt: number | null = null
  for (const e of events) {
    const recomputed = await sha256(serialize(e, prev))
    if (recomputed !== e.entry_hash && brokenAt === null) {
      brokenAt = e.seq
    }
    // chain forward from the RECOMPUTED hash — once one link diverges from its
    // stored value, every downstream entry fails re-verification too
    prev = recomputed
  }
  return {
    ok: brokenAt === null,
    brokenAt,
    root: events.at(-1)?.entry_hash ?? GENESIS,
    checked: events.length,
  }
}
