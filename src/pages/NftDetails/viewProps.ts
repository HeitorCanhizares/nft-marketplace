import type { useNftPurchase } from '@/hooks/useNftPurchase'
import type { NftDetail } from '@/types/nft'

// Tudo que as telas de detalhe (desktop e mobile) recebem da página: dados, compra, carrinho e favorito.
export type NftDetailViewProps = {
  nft: NftDetail
  purchase: ReturnType<typeof useNftPurchase>
  updatedEditionId: string | null
  cart: {
    onBuy: () => void
    onAddToCart: () => void
    pending: boolean
    added: boolean
    error: { editionId: string; message: string } | null
  }
  favorite: {
    onToggle: () => void
    busy: boolean
  }
}
