import { useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { useState } from 'react'

import { BUY_BAR_SPACE_CLASS, BuyBar } from '@/components/shared/BuyBar'
import { EditionSelector } from '@/components/shared/EditionSelector'
import { FavoriteButton } from '@/components/shared/FavoriteButton'
import { NftGallery } from '@/components/shared/NftGallery'
import { NftMeta } from '@/components/shared/NftMeta'
import { RatingStars } from '@/components/shared/RatingStars'
import { ReviewsSheet } from '@/components/shared/ReviewsSheet'
import { Button } from '@/components/ui/button'
import { useReviews } from '@/hooks/useReviews'
import { cn } from '@/lib/utils'
import type { NftDetailViewProps } from '@/pages/NftDetails/viewProps'

// Tela mobile do detalhe: imagem com voltar e favorito, painel, barra de compra e avaliações em drawer.
export function NftDetailMobile({
  nft,
  purchase,
  updatedEditionId,
  cart,
  favorite,
}: NftDetailViewProps) {
  const router = useRouter()
  const navigate = useNavigate()
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const reviews = useReviews(nft.id, reviewsOpen)

  function goBack(): void {
    if (router.history.canGoBack()) {
      router.history.back()
      return
    }
    void navigate({ to: '/' })
  }

  const cartError = cart.error?.editionId === purchase.editionId ? cart.error.message : null

  return (
    <div className="flex flex-col bg-card">
      <section className="relative pt-[calc(env(safe-area-inset-top)+66px)]">
        <div className="absolute inset-x-7 top-[calc(env(safe-area-inset-top)+22px)] z-10 flex items-center justify-between">
          <Button
            type="button"
            variant="icon"
            size="icon"
            aria-label="Voltar"
            onClick={goBack}
            className="size-9 rounded-full"
          >
            <ArrowLeftIcon aria-hidden="true" />
          </Button>
          <FavoriteButton
            variant="circle"
            label={nft.name}
            pressed={nft.isFavorite === true}
            busy={favorite.busy}
            onToggle={favorite.onToggle}
            className="size-9 rounded-full"
          />
        </div>
        <NftGallery images={nft.images} name={nft.name} />
      </section>

      <div
        className={cn(
          'relative -mt-[35px] flex flex-col rounded-t-[28px] bg-card px-6 pt-8',
          BUY_BAR_SPACE_CLASS,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-foreground">{nft.name}</h1>
          <RatingStars
            variant="pill"
            average={nft.rating.average}
            count={nft.rating.count}
            onClick={() => setReviewsOpen(true)}
          />
        </div>

        <p className="mt-2.5 text-sm leading-6 text-muted-foreground">{nft.description}</p>

        <div className="mt-2.5 flex flex-col gap-1">
          <span className="text-sm font-bold text-foreground">Edição:</span>
          <EditionSelector
            editions={nft.editions}
            value={purchase.editionId}
            onChange={purchase.selectEdition}
          />
        </div>

        {cartError || purchase.notice || purchase.inCartText ? (
          <div role="status" className="mt-4 flex flex-col gap-1 text-sm">
            {cartError ? <p className="text-destructive">{cartError}</p> : null}
            {purchase.notice ? <p className="text-muted-foreground">{purchase.notice}</p> : null}
            {purchase.inCartText ? (
              <p className="text-muted-foreground">{purchase.inCartText}</p>
            ) : null}
          </div>
        ) : null}

        <NftMeta
          className="mt-3"
          tokenId={nft.tokenId}
          collection={nft.collection.name}
          attributes={nft.attributes}
        />
      </div>

      <BuyBar
        price={purchase.edition.price}
        stepper={{
          value: purchase.quantity,
          max: purchase.max,
          hint: purchase.hint,
          onChange: (next) =>
            next > purchase.quantity ? purchase.increment() : purchase.decrement(),
        }}
        onBuy={cart.onBuy}
        onAddToCart={cart.onAddToCart}
        canAdd={purchase.canAdd}
        soldOut={purchase.allSoldOut}
        pending={cart.pending}
        added={cart.added}
        updated={updatedEditionId === purchase.editionId}
      />

      <ReviewsSheet
        open={reviewsOpen}
        onOpenChange={setReviewsOpen}
        count={nft.rating.count}
        reviews={reviews}
      />
    </div>
  )
}
