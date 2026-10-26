import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useRouteChrome } from '@/hooks/useRouteChrome'

// Título do documento e foco no <h1> a cada troca de caminho (não a cada mudança de search ou hash).
export function useRouteFocus(): void {
  const router = useRouter()
  const { title } = useRouteChrome()

  useEffect(() => {
    document.title = title ? `${title} | Kurio` : 'Kurio'
  }, [title])

  useEffect(() => {
    return router.subscribe('onResolved', ({ fromLocation, pathChanged }) => {
      if (!fromLocation || !pathChanged) {
        return
      }

      requestAnimationFrame(() => {
        const main = document.getElementById('conteudo')
        if (!main) {
          return
        }

        const heading = Array.from(main.querySelectorAll('h1')).find((element) =>
          element.checkVisibility(),
        )
        const target = heading ?? main

        target.setAttribute('tabindex', '-1')
        target.style.outline = 'none'
        target.focus()
      })
    })
  }, [router])
}
