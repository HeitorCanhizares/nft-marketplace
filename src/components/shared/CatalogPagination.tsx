import type { MouseEvent } from 'react'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { buildPageItems } from '@/lib/pagination'
import { cn } from '@/lib/utils'

type CatalogPaginationProps = {
  page: number
  totalPages: number
  getHref: (page: number) => string
  onPageChange: (page: number) => void
  className?: string
}

// Clique sem modificadores troca a página na tela; Ctrl/Cmd/Shift/botão do meio seguem o link real.
function isPlainClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey
}

export function CatalogPagination({
  page,
  totalPages,
  getHref,
  onPageChange,
  className,
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null

  const items = buildPageItems(page, totalPages)

  function handleClick(event: MouseEvent<HTMLAnchorElement>, target: number) {
    if (!isPlainClick(event)) return
    event.preventDefault()
    onPageChange(target)
  }

  return (
    <Pagination aria-label="Paginação do catálogo" className={cn('justify-end', className)}>
      <PaginationContent>
        {page > 1 ? (
          <PaginationItem>
            <PaginationPrevious
              href={getHref(page - 1)}
              aria-label="Página anterior"
              onClick={(event) => {
                handleClick(event, page - 1)
              }}
            />
          </PaginationItem>
        ) : null}

        {items.map((item, index) =>
          item === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                href={getHref(item)}
                isActive={item === page}
                aria-label={`Página ${item}`}
                onClick={(event) => {
                  handleClick(event, item)
                }}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        {page < totalPages ? (
          <PaginationItem>
            <PaginationNext
              href={getHref(page + 1)}
              aria-label="Próxima página"
              onClick={(event) => {
                handleClick(event, page + 1)
              }}
            />
          </PaginationItem>
        ) : null}
      </PaginationContent>
    </Pagination>
  )
}
