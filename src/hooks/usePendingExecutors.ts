import { useEffect } from 'react'

import { queryClient } from '@/app/queryClient'
import { favorites, home, nfts } from '@/hooks/queryKeys'
import { registerPendingExecutor } from '@/lib/pendingAction'
import { addFavorite } from '@/services/api/favorites'

// Registra os executores das ações pendentes guardadas antes do login (hoje: favoritar).
export function usePendingExecutors() {
  useEffect(
    () =>
      registerPendingExecutor('favorite', async ({ nftId }) => {
        await addFavorite(nftId)
        // As listas em cache são de visitante (sem isFavorite): precisam ser refeitas com o token.
        // Uma primeira carga em andamento pode ter lido o banco antes do favorito: o invalidate só
        // reaproveitaria essa requisição, então ela é cancelada antes.
        const keys = [nfts.lists, home, nfts.details, nfts.relatedAll, favorites]
        await Promise.all(keys.map((queryKey) => queryClient.cancelQueries({ queryKey })))
        await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
        return 'Adicionado aos favoritos.'
      }),
    [],
  )
}
