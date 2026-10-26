import { cn } from '@/lib/utils'

type NftMetaProps = {
  tokenId: string
  collection: string
  attributes: readonly string[]
  className?: string
}

// Metadados do NFT em lista de definição: ID do token, coleção e atributos.
export function NftMeta({ tokenId, collection, attributes, className }: NftMetaProps) {
  return (
    <dl className={cn('flex flex-col gap-3 text-sm text-muted-foreground', className)}>
      <div className="flex gap-1.5">
        <dt>ID do token:</dt>
        <dd>{tokenId}</dd>
      </div>
      <div className="flex gap-1.5">
        <dt>Coleção:</dt>
        <dd>{collection}</dd>
      </div>
      <div className="flex gap-1.5">
        <dt>Atributos:</dt>
        <dd>{attributes.join(', ')}</dd>
      </div>
    </dl>
  )
}
