import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { nfts } from '@/hooks/queryKeys'
import { keepOrder } from '@/lib/stableOrder'
import { getCatalog, toCatalogParams } from '@/services/api/nfts'
import type { HomeSearch } from '@/types/catalog'

// Consulta do catálogo da Início. Trocar o filtro mantém a grade anterior (esmaecida) até a resposta nova.
export function useCatalog(search: HomeSearch, isDesktop: boolean) {
  const params = toCatalogParams(search, isDesktop)
  const paramsKey = JSON.stringify(params)

  const query = useQuery({
    queryKey: nfts.list(params),
    queryFn: ({ signal }) => getCatalog(params, signal),
    placeholderData: keepPreviousData,
  })
  const { data, isPlaceholderData } = query

  // Ids na ordem exibida, da última resposta real, com a chave dela.
  const [last, setLast] = useState<{ key: string; ids: string[] } | null>(null)

  const items = useMemo(() => {
    if (!data) return undefined
    const previousIds = last && (isPlaceholderData || last.key === paramsKey) ? last.ids : []
    return keepOrder(previousIds, data.items)
  }, [data, isPlaceholderData, last, paramsKey])

  if (items && !isPlaceholderData) {
    const ids = items.map((item) => item.id)
    if (last?.key !== paramsKey || last.ids.join() !== ids.join()) {
      setLast({ key: paramsKey, ids })
    }
  }

  return { ...query, params, items }
}
