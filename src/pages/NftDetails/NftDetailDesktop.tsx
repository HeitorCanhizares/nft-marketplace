import { Link } from '@tanstack/react-router'
import { useRef, useState } from 'react'

import { EditionSelector } from '@/components/shared/EditionSelector'
import { FavoriteButton } from '@/components/shared/FavoriteButton'
import { NftCarousel } from '@/components/shared/NftCarousel'
import { NftGallery } from '@/components/shared/NftGallery'
import { NftMeta } from '@/components/shared/NftMeta'
import { PriceChangedNotice } from '@/components/shared/PriceChangedNotice'
import { PriceTag } from '@/components/shared/PriceTag'
import { QuantityStepper } from '@/components/shared/QuantityStepper'
import { RatingStars } from '@/components/shared/RatingStars'
import { ShareLinks } from '@/components/shared/ShareLinks'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useAddToCart } from '@/hooks/useAddToCart'
import { useRelatedNfts } from '@/hooks/useNftDetail'
import { useToggleFavorite } from '@/hooks/useToggleFavorite'
import type { NftDetailViewProps } from '@/pages/NftDetails/viewProps'
import { NftDetailTabs, type NftDetailTab } from '@/pages/NftDetails/NftDetailTabs'

// Tela desktop do detalhe: galeria e painel de compra, abas e "Mais desta coleção".
export function NftDetailDesktop({
  nft,
  purchase,
  updatedEditionId,
  cart,
  favorite,
}: NftDetailViewProps) {
  const [tab, setTab] = useState<NftDetailTab>('details')
  const tabsRef = useRef<HTMLDivElement>(null)
  const reviewsTriggerRef = useRef<HTMLButtonElement>(null)

  const related = useRelatedNfts(nft.id)
  const { toggle, pendingIds: favoritePending } = useToggleFavorite()
  const { add, pendingIds: cartPending } = useAddToCart()

  // Nota: leva às avaliações, rola até as abas e põe o foco na aba no frame seguinte.
  function openReviews(): void {
    setTab('reviews')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    tabsRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    requestAnimationFrame(() => {
      reviewsTriggerRef.current?.focus()
    })
  }

  const edition = purchase.edition
  const cartError = cart.error?.editionId === purchase.editionId ? cart.error.message : null

  return (
    <div className="container-page flex flex-col gap-16 py-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Início</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" hash="catalogo">
                Mercado
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage aria-current="page">{nft.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-12">
        <NftGallery images={nft.images} name={nft.name} />

        <div className="flex min-w-0 flex-col gap-6">
          <h1 className="text-heading font-bold text-foreground">{nft.name}</h1>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <PriceTag
                price={edition.price}
                previousPrice={edition.id === nft.defaultEditionId ? nft.previousPrice : undefined}
              />
              {updatedEditionId === purchase.editionId ? (
                <PriceChangedNotice kind="updated" />
              ) : null}
            </div>
            <RatingStars
              average={nft.rating.average}
              count={nft.rating.count}
              onClick={openReviews}
            />
          </div>

          <hr className="border-border-soft" />

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-foreground">Sobre este NFT:</h2>
            <p className="text-body text-muted-foreground">{nft.description}</p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-foreground">Edição:</span>
            <EditionSelector
              editions={nft.editions}
              value={purchase.editionId}
              onChange={purchase.selectEdition}
            />
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <QuantityStepper
                value={purchase.quantity}
                max={purchase.max}
                hint={purchase.hint}
                onChange={(next) =>
                  next > purchase.quantity ? purchase.increment() : purchase.decrement()
                }
              />
              {purchase.inCartText ? (
                <p className="text-sm text-muted-foreground">{purchase.inCartText}</p>
              ) : null}
            </div>
            <div className="flex items-start gap-3">
              <Button
                type="button"
                size="lg"
                aria-busy={cart.pending || undefined}
                disabled={purchase.allSoldOut}
                onClick={() => {
                  if (!cart.pending) cart.onBuy()
                }}
                className="h-11 min-w-48"
              >
                {purchase.allSoldOut ? 'Esgotado' : 'COMPRAR'}
              </Button>
              <FavoriteButton
                variant="text"
                label={nft.name}
                pressed={nft.isFavorite === true}
                busy={favorite.busy}
                onToggle={favorite.onToggle}
              />
            </div>
          </div>

          {cartError || purchase.notice ? (
            <div role="status" className="flex flex-col gap-1 text-sm text-destructive">
              {cartError ? <p>{cartError}</p> : null}
              {purchase.notice ? <p className="text-muted-foreground">{purchase.notice}</p> : null}
            </div>
          ) : null}

          <hr className="border-border-soft" />

          <NftMeta
            tokenId={nft.tokenId}
            collection={nft.collection.name}
            attributes={nft.attributes}
          />

          <ShareLinks url={`${window.location.origin}/nft/${nft.id}`} title={nft.name} />
        </div>
      </div>

      <div ref={tabsRef} className="scroll-mt-8">
        <NftDetailTabs
          nft={nft}
          value={tab}
          onValueChange={setTab}
          reviewsTriggerRef={reviewsTriggerRef}
        />
      </div>

      <NftCarousel
        title="Mais desta coleção"
        items={related.data}
        isLoading={related.isPending}
        isError={related.isError}
        onRetry={() => {
          void related.refetch()
        }}
        onAddToCart={add}
        onToggleFavorite={toggle}
        favoriteBusyIds={favoritePending}
        cartBusyIds={cartPending}
      />
    </div>
  )
}
