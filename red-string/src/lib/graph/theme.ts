import type { EntityType } from '@/lib/api/types'

/** muted categorical palette, tuned for a near-black canvas */
export const COMMUNITY_COLORS: Record<number, string> = {
  1: '#fbbf24', // core ring — fuchsia (red is reserved for priority / suspicious)
  2: '#fb923c', // mule pool — orange
  3: '#a78bfa', // recruiters — violet
  4: '#4ade80', // legitimate cluster — green
  5: '#64748b', // noise — slate
  6: '#94a3b8', // namesake / trap
  7: '#94a3b8',
}

export function communityColor(c?: number): string {
  if (c === undefined) return '#52525b'
  return COMMUNITY_COLORS[c] ?? '#52525b'
}

export const PRIORITY_BANDS = [
  { min: 7, label: 'HIGH', color: '#ef4444', badge: 'string' as const },
  { min: 4, label: 'MEDIUM', color: '#f59e0b', badge: 'warning' as const },
  { min: 0.1, label: 'LOW', color: '#3f3f46', badge: 'secondary' as const },
  { min: -1, label: 'NONE', color: '#27272a', badge: 'secondary' as const },
]

export function priorityBand(score = 0) {
  return PRIORITY_BANDS.find((b) => score >= b.min) ?? PRIORITY_BANDS.at(-1)!
}

export const ENTITY_META: Record<EntityType, { label: string; short: string; color: string }> = {
  PERSON: { label: 'Person', short: 'PER', color: '#e4e4e7' },
  PHONE: { label: 'Phone', short: 'PH', color: '#38bdf8' },
  ACCOUNT: { label: 'Account', short: 'AC', color: '#34d399' },
  VEHICLE: { label: 'Vehicle', short: 'VEH', color: '#fbbf24' },
  LOCATION: { label: 'Location', short: 'LOC', color: '#c084fc' },
  ORGANIZATION: { label: 'Organization', short: 'ORG', color: '#f472b6' },
  CASE: { label: 'Case', short: 'CASE', color: '#94a3b8' },
}

export const EDGE_META: Record<
  string,
  { label: string; color: string; dashed?: boolean }
> = {
  ASSOCIATED_WITH: { label: 'Association', color: '#52525b' },
  CALLED: { label: 'Call', color: '#38bdf8' },
  TRANSFERRED_TO: { label: 'Transfer', color: '#34d399' },
  OWNS: { label: 'Owns', color: '#3f3f46', dashed: true },
  LOCATED_AT: { label: 'Located at', color: '#7c3aed', dashed: true },
  MET: { label: 'Met', color: '#f59e0b' },
  MENTIONED_IN: { label: 'Mentioned in', color: '#475569', dashed: true },
  SAME_AS: { label: 'Merged identity', color: '#a1a1aa', dashed: true },
}

export const STRING_RED = '#ef4444'
