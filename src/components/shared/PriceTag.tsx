import { formatEth } from '@/lib/formatEth'
import { cn } from '@/lib/utils'

type PriceTagProps = {
  price: string
  previousPrice?: string
  className?: string
}

export function PriceTag({ price, previousPrice, className }: PriceTagProps) {
  return (
    <p className={cn('flex flex-wrap gap-x-3 text-base lg:text-[22px] lg:leading-7', className)}>
      <span className="font-bold text-price">
        <span className="sr-only">preço atual </span>
        {formatEth(price)}
      </span>
      {previousPrice !== undefined ? (
        <>
          <span className="sr-only">preço anterior </span>
          <s className="font-normal text-tan">{formatEth(previousPrice)}</s>
        </>
      ) : null}
    </p>
  )
}
