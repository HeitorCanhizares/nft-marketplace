import { StarIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadMoreButton } from '@/components/shared/LoadMoreButton'
import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import type { ReviewsState } from '@/hooks/useReviews'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type ReviewsPanelProps = {
  reviews: ReviewsState
  className?: string
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })

// Lista de avaliações só leitura, com "Carregar mais" por páginas.
export function ReviewsPanel({ reviews, className }: ReviewsPanelProps) {
  const { items, total, hasMore, isLoading, isError, isLoadingMore, loadMore, retry } = reviews
  const { announce } = useLiveAnnouncer()
  const listRef = useRef<HTMLUListElement>(null)
  const shownRef = useRef(0)
  const focusListRef = useRef(false)

  // Anuncia só quando mais avaliações chegam depois da primeira página.
  useEffect(() => {
    if (items.length === 0 || items.length === shownRef.current) return
    const grew = shownRef.current > 0
    shownRef.current = items.length
    if (grew) announce(`Mostrando ${items.length} de ${total} avaliações`, 'polite')
  }, [items.length, total, announce])

  // Se "Carregar mais" some com o foco nele, o foco vai para a lista.
  useEffect(() => {
    if (!isLoadingMore && !hasMore && focusListRef.current) {
      focusListRef.current = false
      listRef.current?.focus()
    }
  }, [hasMore, isLoadingMore])

  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-4', className)} aria-busy="true">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (isError && items.length === 0) {
    return (
      <ErrorState
        as="h3"
        title="Não foi possível carregar as avaliações"
        message="Verifique sua conexão e tente novamente."
        onRetry={retry}
        className={cn('py-6', className)}
      />
    )
  }

  if (total === 0) {
    return <EmptyState as="h3" title="Ainda não há avaliações" className={cn('py-8', className)} />
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <ul ref={listRef} tabIndex={-1} className="flex flex-col gap-6 outline-none">
        {items.map((review) => (
          <li key={review.id}>
            <article className="flex flex-col gap-2 border-b border-border-soft pb-6">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  role="img"
                  aria-label={`Nota ${review.rating} de 5`}
                  className="inline-flex items-center gap-0.5"
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <StarIcon
                      key={index}
                      aria-hidden="true"
                      className={cn(
                        'size-4',
                        index < review.rating ? 'fill-current text-primary' : 'text-border-strong',
                      )}
                    />
                  ))}
                </span>
                <span className="font-bold text-foreground">{review.author}</span>
                <time dateTime={review.createdAt} className="text-sm text-muted-foreground">
                  {dateFormatter.format(new Date(review.createdAt))}
                </time>
              </div>
              <p className="text-body text-foreground">{review.body}</p>
            </article>
          </li>
        ))}
      </ul>

      {hasMore ? (
        <LoadMoreButton
          loading={isLoadingMore}
          onClick={() => {
            focusListRef.current = true
            loadMore()
          }}
        />
      ) : null}
    </div>
  )
}
