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
      <TabsList className="w-full justify-start gap-10 border-b border-border-soft">
        <TabsTrigger value="details" className="text-base">
          Detalhes do NFT
        </TabsTrigger>
        <TabsTrigger ref={reviewsTriggerRef} value="reviews" className="text-base">
          {`Avaliações de colecionadores (${nft.rating.count})`}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="pt-4">
        <p className="text-sm leading-6 text-muted-foreground">{nft.details.body}</p>
        <dl className="mt-6 flex flex-col gap-4 text-sm leading-6">
          <div>
            <dt className="font-bold text-foreground">Rede:</dt>
            <dd className="text-muted-foreground">{nft.details.network}</dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Contrato:</dt>
            <dd className="break-all text-muted-foreground">{nft.details.contract}</dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Direitos autorais:</dt>
            <dd className="text-muted-foreground">{nft.details.royalties}</dd>
          </div>
        </dl>
      </TabsContent>

      <TabsContent value="reviews" className="pt-6">
        <ReviewsPanel reviews={reviews} />
      </TabsContent>
    </Tabs>
  )
}
