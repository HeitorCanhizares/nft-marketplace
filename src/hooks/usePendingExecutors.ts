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
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: nfts.lists }),
          queryClient.invalidateQueries({ queryKey: home }),
          queryClient.invalidateQueries({ queryKey: nfts.details }),
          queryClient.invalidateQueries({ queryKey: nfts.relatedAll }),
          queryClient.invalidateQueries({ queryKey: favorites }),
        ])
        return 'Adicionado aos favoritos.'
      }),
    [],
  )
}
