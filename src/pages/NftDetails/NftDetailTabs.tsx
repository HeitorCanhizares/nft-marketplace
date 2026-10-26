import type { Ref } from 'react'

import { ReviewsPanel } from '@/components/shared/ReviewsPanel'
import { TabsContent, TabsList, TabsTrigger, Tabs } from '@/components/ui/tabs'
import { useReviews } from '@/hooks/useReviews'
import type { NftDetail } from '@/types/nft'

export type NftDetailTab = 'details' | 'reviews'

type NftDetailTabsProps = {
  nft: NftDetail
  value: NftDetailTab
  onValueChange: (value: NftDetailTab) => void
  reviewsTriggerRef?: Ref<HTMLButtonElement>
}

// Abas do detalhe: informações do NFT e avaliações (carregadas só ao abrir a aba).
export function NftDetailTabs({
  nft,
  value,
  onValueChange,
  reviewsTriggerRef,
}: NftDetailTabsProps) {
  const reviews = useReviews(nft.id, value === 'reviews')

  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next === 'reviews' ? 'reviews' : 'details')}
    >
      <TabsList className="w-full justify-start gap-6 border-b border-border-soft">
        <TabsTrigger value="details">Detalhes do NFT</TabsTrigger>
        <TabsTrigger ref={reviewsTriggerRef} value="reviews">
          {`Avaliações de colecionadores (${nft.rating.count})`}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="pt-6">
        <p className="text-body text-foreground">{nft.details.body}</p>
        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          <dt className="text-muted-foreground">Rede:</dt>
          <dd className="text-foreground">{nft.details.network}</dd>
          <dt className="text-muted-foreground">Contrato:</dt>
          <dd className="break-all text-foreground">{nft.details.contract}</dd>
          <dt className="text-muted-foreground">Direitos autorais:</dt>
          <dd className="text-foreground">{nft.details.royalties}</dd>
        </dl>
      </TabsContent>

      <TabsContent value="reviews" className="pt-6">
        <ReviewsPanel reviews={reviews} />
      </TabsContent>
    </Tabs>
  )
}
