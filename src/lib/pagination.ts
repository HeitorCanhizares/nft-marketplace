export type PageItem = number | 'ellipsis'

const MAX_WITHOUT_ELLIPSIS = 7

// Páginas a mostrar: sempre a primeira e a última; perto das pontas, mostra o bloco inicial ou final.
export function buildPageItems(current: number, total: number): PageItem[] {
  if (total < 1) return []

  if (total <= MAX_WITHOUT_ELLIPSIS) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const page = Math.min(Math.max(current, 1), total)

  if (page <= 3) return [1, 2, 3, 4, 'ellipsis', total]
  if (page >= total - 2) return [1, 'ellipsis', total - 3, total - 2, total - 1, total]

  return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', total]
}
