import { useMemo } from 'react'
import { useMatches } from '@tanstack/react-router'
import type { StaticDataRouteOption } from '@tanstack/react-router'

export type RouteChrome = {
  title: string | undefined
  footer: boolean
  mobileTabBar: boolean
}

type RouteMatchLike = { staticData: StaticDataRouteOption }

// Devolve o valor da rota mais profunda que define a chave (a folha vence o layout).
function deepestStaticValue<K extends keyof StaticDataRouteOption>(
  matches: ReadonlyArray<RouteMatchLike>,
  key: K,
): StaticDataRouteOption[K] {
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const value = matches[index].staticData[key]
    if (value !== undefined) {
      return value
    }
  }
  return undefined
}

export function useRouteChrome(): RouteChrome {
  const title = useMatches({
    select: (matches) => deepestStaticValue(matches, 'title'),
  })
  const footer = useMatches({
    select: (matches) => deepestStaticValue(matches, 'footer') ?? true,
  })
  const mobileTabBar = useMatches({
    select: (matches) => deepestStaticValue(matches, 'mobileTabBar') ?? false,
  })

  return useMemo(() => ({ title, footer, mobileTabBar }), [title, footer, mobileTabBar])
}
