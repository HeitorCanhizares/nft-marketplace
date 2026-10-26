import { useIsDesktop } from '@/hooks/useMediaQuery'
import { HomeDesktop } from '@/pages/Home/HomeDesktop'
import { HomeMobile } from '@/pages/Home/HomeMobile'
import type { HomeSearch } from '@/types/catalog'

// Sem parâmetros (SignIn e SignUp, atrás do modal), a Início mostra o catálogo padrão.
const EMPTY_HOME_SEARCH: HomeSearch = {
  q: undefined,
  aba: undefined,
  colecao: undefined,
  rede: undefined,
  precoMin: undefined,
  precoMax: undefined,
  ordem: undefined,
  pagina: undefined,
  favoritos: undefined,
}

export function Home({ search = EMPTY_HOME_SEARCH }: { search?: HomeSearch }) {
  const isDesktop = useIsDesktop()

  return (
    <>
      <h1 className="sr-only">Kurio</h1>
      {isDesktop ? <HomeDesktop search={search} /> : <HomeMobile search={search} />}
    </>
  )
}
