import { Outlet, useNavigate, useSearch } from '@tanstack/react-router'

import { useAuth } from '@/contexts/auth'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useRouteChrome } from '@/hooks/useRouteChrome'
import { useRouteFocus } from '@/hooks/useRouteFocus'
import { useSignOut } from '@/hooks/useSignOut'

import { Footer } from './Footer'
import { Header } from './Header'
import { MOBILE_TAB_BAR_HEIGHT, MobileTabBar } from './MobileTabBar'

const TOAST_GAP = 16
const TOAST_BOTTOM = 24

export function AppShell() {
  useRouteFocus()

  const { status, user } = useAuth()
  const signOut = useSignOut()
  const { footer, mobileTabBar } = useRouteChrome()
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()
  const { q } = useSearch({ strict: false })

  // Mobile com a barra visível: o toast sobe para não ficar atrás dela.
  const toastBottom = !isDesktop && mobileTabBar ? MOBILE_TAB_BAR_HEIGHT + TOAST_GAP : TOAST_BOTTOM

  function handleSearch(query: string) {
    void navigate({ to: '/', search: { q: query }, hash: 'catalogo' })
  }

  return (
    <TooltipProvider>
      <a
        href="#conteudo"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('conteudo')?.focus()
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>

      <div className="flex min-h-dvh flex-col overflow-x-clip">
        <Header
          className="max-lg:hidden"
          authStatus={status}
          user={user}
          cartCount={0}
          onSignOut={() => void signOut()}
          searchQuery={typeof q === 'string' ? q : undefined}
          onSearch={handleSearch}
        />

        <main
          id="conteudo"
          tabIndex={-1}
          className={
            mobileTabBar
              ? 'flex-1 outline-none max-lg:pb-[calc(96px+env(safe-area-inset-bottom))] lg:pt-8'
              : 'flex-1 outline-none lg:pt-8'
          }
        >
          <Outlet />
        </main>

        {footer && <Footer className="max-lg:hidden" />}

        {mobileTabBar && <MobileTabBar className="lg:hidden" />}
      </div>

      <Toaster
        position={isDesktop ? 'bottom-right' : 'bottom-center'}
        offset={{ bottom: toastBottom }}
        mobileOffset={{ bottom: toastBottom }}
      />
    </TooltipProvider>
  )
}
