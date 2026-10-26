import { createFileRoute } from '@tanstack/react-router'

import { queryClient } from '@/app/queryClient'
import { nftDetailOptions } from '@/hooks/useNftDetail'
import { isApiError } from '@/services/http/ApiError'
import { NftDetails } from '@/pages/NftDetails/NftDetails'
import { NftDetailSkeleton } from '@/pages/NftDetails/NftDetailSkeleton'

const NOT_FOUND_TITLE = 'NFT não encontrado'

export const Route = createFileRoute('/nft/$nftId')({
  loader: async ({ context, params }) => {
    // Espera a sessão: o isFavorite depende do token, então a primeira leitura tem que ser com ele.
    if (context.auth.status === 'loading') await context.auth.ready

    try {
      const nft = await queryClient.ensureQueryData(nftDetailOptions(params.nftId))
      return { notFound: false, documentTitle: nft.name }
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        return { notFound: true, documentTitle: NOT_FOUND_TITLE }
      }
      throw error
    }
  },
  pendingComponent: NftDetailSkeleton,
  pendingMs: 200,
  component: NftDetailsRoute,
})

function NftDetailsRoute() {
  const { nftId } = Route.useParams()
  const { notFound } = Route.useLoaderData()
  return <NftDetails nftId={nftId} notFound={notFound} />
}
