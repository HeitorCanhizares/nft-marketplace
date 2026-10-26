import type { QueryClient } from '@tanstack/react-query'
import { PRIVATE_QUERY_ROOTS, nfts } from '@/hooks/queryKeys'
import { clearGuestCartId } from '@/lib/session'
import { STORAGE_KEYS, storage } from '@/lib/storage'
import { getWalletProvider } from '@/services/wallet'
import { clearSubscriptions, reconnectSocket } from '@/services/realtime/socket'

// Limpa os dados privados do usuário atual (logout, expiração seguida de outro
// usuário e troca de usuário). Idempotente: chamar de novo não falha.
export async function clearPrivateSession(queryClient: QueryClient): Promise<void> {
  // 1. Raízes privadas e todas as queries de nfts: `isFavorite` pode estar em
  // qualquer lista ou detalhe, então remover tudo de `nfts` é mais seguro.
  for (const root of PRIVATE_QUERY_ROOTS) {
    queryClient.removeQueries({ queryKey: [root] })
  }
  queryClient.removeQueries({ queryKey: nfts.all })

  // 2. Encerra as inscrições do socket e reconecta com o token atual (ou sem token).
  clearSubscriptions()
  reconnectSocket()

  // 3. Desconecta a carteira simulada. Falha é ignorada: o logout não pode travar por ela.
  try {
    await getWalletProvider()?.disconnect()
  } catch {
    // Ignorado de propósito.
  }

  // 4. Apaga o estado de checkout guardado na sessão do navegador.
  storage.session.remove(STORAGE_KEYS.checkout)
  storage.session.remove(STORAGE_KEYS.checkoutDraft)

  // 5. O próximo carrinho de visitante é novo: o id só é criado no primeiro item.
  clearGuestCartId()
}
