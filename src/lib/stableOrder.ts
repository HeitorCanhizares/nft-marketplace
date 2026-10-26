// Se `next` tem exatamente os mesmos ids de `previous` (em outra ordem), devolve `next` na ordem de `previous`.
// Caso contrário devolve `next` como veio.
export function keepOrder<T extends { id: string }>(
  previous: readonly string[],
  next: readonly T[],
): T[] {
  const ids = new Set(previous)
  if (ids.size !== previous.length || ids.size !== next.length) return [...next]

  const byId = new Map(next.map((item) => [item.id, item]))
  const ordered: T[] = []
  for (const id of previous) {
    const item = byId.get(id)
    if (item === undefined) return [...next]
    ordered.push(item)
  }
  return ordered
}
