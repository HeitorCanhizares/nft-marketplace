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
    <dl className={cn('grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm', className)}>
      <dt className="text-muted-foreground">ID do token</dt>
      <dd className="text-foreground">{tokenId}</dd>
      <dt className="text-muted-foreground">Coleção</dt>
      <dd className="text-foreground">{collection}</dd>
      <dt className="text-muted-foreground">Atributos</dt>
      <dd className="text-foreground">{attributes.join(', ')}</dd>
    </dl>
  )
}
