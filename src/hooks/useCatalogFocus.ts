import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from '@tanstack/react-router'

import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import type { NftSummary } from '@/types/nft'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

type CatalogFocusState = {
  ready: boolean
  items?: readonly NftSummary[]
  total?: number
  page: number
  totalPages?: number
}

// Sinal da última ação: troca de página ou "Carregar mais". Escrito só em handlers, lido só em efeito.
type FocusSignal = { kind: 'page' } | { kind: 'more'; previousCount: number }

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

// Rolagem, foco e anúncios do catálogo: um lugar só decide para onde vai o foco depois de cada ação.
export function useCatalogFocus(state: CatalogFocusState) {
  const router = useRouter()
  const { announce } = useLiveAnnouncer()

  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const gridRef = useRef<HTMLUListElement | null>(null)
  const signalRef = useRef<FocusSignal | null>(null)

  const scrollToCatalog = useCallback(() => {
    const title = titleRef.current
    if (!title) return

    const section = title.closest<HTMLElement>('#catalogo') ?? title
    section.scrollIntoView({
      block: 'start',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }, [])

  const focusCatalog = useCallback(() => {
    const title = titleRef.current
    if (!title) return

    scrollToCatalog()
    title.focus({ preventScroll: true })
  }, [scrollToCatalog])

  const ensureCatalogVisible = useCallback(() => {
    const title = titleRef.current
    if (!title) return

    const section = title.closest<HTMLElement>('#catalogo') ?? title
    const rect = section.getBoundingClientRect()
    if (rect.top < 0 || rect.top > window.innerHeight * 0.5) {
      scrollToCatalog()
    }
  }, [scrollToCatalog])

  // Âncora #catalogo ou filtro vindo de fora da seção (ex.: rodapé): alinha o catálogo depois do foco de rota.
  useEffect(() => {
    let outer = 0
    let inner = 0

    function schedule(action: () => void) {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
      outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => {
          action()
        })
      })
    }

    const unsubscribe = router.subscribe('onResolved', ({ fromLocation, toLocation }) => {
      if (toLocation.hash === 'catalogo') {
        schedule(focusCatalog)
        return
      }
      if (
        toLocation.pathname === '/' &&
        fromLocation &&
        toLocation.searchStr !== fromLocation.searchStr &&
        toLocation.searchStr.includes('colecao=')
      ) {
        schedule(ensureCatalogVisible)
      }
    })

    if (window.location.hash === '#catalogo') schedule(focusCatalog)

    return () => {
      unsubscribe()
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [router, focusCatalog, ensureCatalogVisible])

  const markPageChange = useCallback(() => {
    signalRef.current = { kind: 'page' }
    focusCatalog()
    requestAnimationFrame(() => {
      focusCatalog()
    })
  }, [focusCatalog])

  const markLoadMore = useCallback((previousCount: number) => {
    signalRef.current = { kind: 'more', previousCount }
  }, [])

  const { ready, items, total, page, totalPages } = state

  // Consome o sinal quando os dados da ação chegam (ready já exclui o placeholder).
  useEffect(() => {
    const signal = signalRef.current
    if (!signal || !ready) return

    if (signal.kind === 'page') {
      signalRef.current = null
      if (totalPages !== undefined) {
        announce(`Página ${page} de ${totalPages}`, 'polite')
      }
      return
    }

    if (!items || items.length <= signal.previousCount) return

    signalRef.current = null
    const newCard = gridRef.current
      ?.querySelectorAll<HTMLElement>('[data-nft-card-link]')
      .item(signal.previousCount)
    newCard?.focus()
    announce(`Mostrando ${items.length} de ${total ?? items.length} NFTs`, 'polite')
  }, [ready, items, total, page, totalPages, announce])

  return {
    titleRef,
    gridRef,
    focusCatalog,
    ensureCatalogVisible,
    markPageChange,
    markLoadMore,
  }
}
