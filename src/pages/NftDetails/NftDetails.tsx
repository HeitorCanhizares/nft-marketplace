import { Link, useNavigate } from '@tanstack/react-router'

import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { useAddEditionToCart } from '@/hooks/useAddEditionToCart'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useNftDetail } from '@/hooks/useNftDetail'
import { useNftDetailLive } from '@/hooks/useNftDetailLive'
import { useNftPurchase } from '@/hooks/useNftPurchase'
import { useToggleFavorite } from '@/hooks/useToggleFavorite'
import { NftDetailDesktop } from '@/pages/NftDetails/NftDetailDesktop'
import { NftDetailMobile } from '@/pages/NftDetails/NftDetailMobile'
import { NftDetailSkeleton } from '@/pages/NftDetails/NftDetailSkeleton'
import type { NftDetailViewProps } from '@/pages/NftDetails/viewProps'
import type { NftDetail } from '@/types/nft'

type NftDetailsProps = {
  nftId: string
  // Vem do loader: true quando o NFT não existe (404).
  notFound: boolean
}

// Página de detalhe: carrega o NFT (cache do loader) e mostra a tela da largura atual.
export function NftDetails({ nftId, notFound }: NftDetailsProps) {
  const detail = useNftDetail(nftId)

  if (detail.data === undefined) {
    if (notFound) {
      return (
        <div className="container-page">
          <EmptyState
            as="h1"
            title="NFT não encontrado"
            description="O NFT que você procura não existe ou foi removido."
            action={
              <Button asChild>
                <Link to="/" hash="catalogo">
                  Ver o catálogo
                </Link>
              </Button>
            }
          />
        </div>
      )
    }
    return <NftDetailSkeleton />
  }

  return <NftDetailContent nft={detail.data} />
}

// Componente interno: só existe com o NFT carregado, então todos os hooks rodam sempre.
function NftDetailContent({ nft }: { nft: NftDetail }) {
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()
  const updatedEditionId = useNftDetailLive(nft).updatedEditionId
  const purchase = useNftPurchase(nft)
  const { add, pending, added, error } = useAddEditionToCart(nft)
  const { toggle, pendingIds } = useToggleFavorite()

  // COMPRAR: com unidades a comprar adiciona e leva ao carrinho; com todas já no carrinho só leva.
  function onBuy(): void {
    if (purchase.canAdd) {
      add({ editionId: purchase.editionId, quantity: purchase.quantity, mode: 'buy' })
      return
    }
    if (purchase.inCart > 0) void navigate({ to: '/carrinho' })
  }

  function onAddToCart(): void {
    if (purchase.canAdd) {
      add({ editionId: purchase.editionId, quantity: purchase.quantity, mode: 'cart' })
    }
  }

  const viewProps: NftDetailViewProps = {
    nft,
    purchase,
    updatedEditionId,
    cart: { onBuy, onAddToCart, pending, added, error },
    favorite: {
      onToggle: () => {
        toggle(nft)
      },
      busy: pendingIds.has(nft.id),
    },
  }

  return isDesktop ? <NftDetailDesktop {...viewProps} /> : <NftDetailMobile {...viewProps} />
}
