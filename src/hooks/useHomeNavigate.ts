import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'

import type { HomeSearch } from '@/types/catalog'

type NavigateOptions = { replace?: boolean }

// Sempre devolve as 9 chaves de HomeSearch (valor ou undefined), para a URL ficar previsível.
function complete(search: HomeSearch): HomeSearch {
  return {
    q: search.q,
    aba: search.aba,
    colecao: search.colecao,
    rede: search.rede,
    precoMin: search.precoMin,
    precoMax: search.precoMax,
    ordem: search.ordem,
    pagina: search.pagina,
    favoritos: search.favoritos,
  }
}

// Concentra as mudanças de URL da Início. Recebe a busca atual por parâmetro e navega sempre para '/',
// porque a Início também fica renderizada atrás do modal de /entrar.
export function useHomeNavigate(search: HomeSearch) {
  const navigate = useNavigate()

  const setFilters = useCallback(
    (changes: Partial<HomeSearch>, options?: NavigateOptions) => {
      void navigate({
        to: '/',
        search: complete({ ...search, ...changes, pagina: undefined }),
        replace: options?.replace === true,
        resetScroll: false,
      })
    },
    [navigate, search],
  )

  const setPage = useCallback(
    (page: number, options?: NavigateOptions) => {
      void navigate({
        to: '/',
        search: complete({ ...search, pagina: page <= 1 ? undefined : page }),
        replace: options?.replace === true,
        resetScroll: false,
      })
    },
    [navigate, search],
  )

  const clearFilters = useCallback(() => {
    void navigate({
      to: '/',
      search: complete({
        aba: search.aba,
        ordem: search.ordem,
        favoritos: search.favoritos,
      }),
      replace: false,
      resetScroll: false,
    })
  }, [navigate, search.aba, search.ordem, search.favoritos])

  const explore = useCallback(
    (hash = 'catalogo') => {
      void navigate({
        to: '/',
        search: complete(search),
        hash,
        replace: true,
        resetScroll: false,
      })
    },
    [navigate, search],
  )

  return { setFilters, setPage, clearFilters, explore }
}
