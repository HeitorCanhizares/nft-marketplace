import { useQuery } from '@tanstack/react-query'

import { getHome } from '@/services/api/nfts'
import { home } from '@/hooks/queryKeys'

// Destaques da Início (hero, destaque, promos, blog). Sem throwOnError: o erro fica no resultado.
export function useHome() {
  return useQuery({
    queryKey: home,
    queryFn: ({ signal }) => getHome(signal),
  })
}
