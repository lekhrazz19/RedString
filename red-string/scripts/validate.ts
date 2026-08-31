import { BASE_GRAPH } from '../src/lib/fixtures/dataset'
const ids = new Set(BASE_GRAPH.nodes.map((n) => n.id))
const bad: string[] = []
for (const e of BASE_GRAPH.edges) {
  if (!ids.has(e.source)) bad.push(`${e.id} src ${e.source}`)
  if (!ids.has(e.target)) bad.push(`${e.id} tgt ${e.target}`)
}
console.log('nodes', BASE_GRAPH.nodes.length, 'edges', BASE_GRAPH.edges.length)
console.log('dangling:', bad.length ? bad.join('; ') : 'none')
console.log('dup node ids:', BASE_GRAPH.nodes.length - ids.size)
const persons = BASE_GRAPH.nodes.filter((n) => n.type === 'PERSON')
console.log('persons', persons.length, 'scored>0', persons.filter((p) => (p.priority_score ?? 0) > 0).length)
