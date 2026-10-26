import { createFileRoute } from '@tanstack/react-router'

// Placeholder: a fase 07 troca pelo NftDetails.
export const Route = createFileRoute('/nft/$nftId')({
  component: () => <h1 className="container-page py-8 text-heading font-bold">NFT</h1>,
})
