import { useMemo } from 'react'
import { useMatches } from '@tanstack/react-router'
import type { StaticDataRouteOption } from '@tanstack/react-router'

export type RouteChrome = {
  title: string | undefined
  footer: boolean
  mobileTabBar: boolean
}

type RouteMatchLike = { staticData: StaticDataRouteOption; loaderData?: unknown }

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

// Título do loader (documentTitle, ex.: nome do NFT) quando a rota tem; senão o título estático.
function documentTitleFromLoader(loaderData: unknown): string | undefined {
  if (typeof loaderData !== 'object' || loaderData === null) return undefined
  const value: unknown = Reflect.get(loaderData, 'documentTitle')
  return typeof value === 'string' ? value : undefined
}

function deepestTitle(matches: ReadonlyArray<RouteMatchLike>): string | undefined {
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index]
    const fromLoader = documentTitleFromLoader(match.loaderData)
    if (fromLoader !== undefined) return fromLoader
    if (match.staticData.title !== undefined) return match.staticData.title
  }
  return undefined
}

export function useRouteChrome(): RouteChrome {
  const title = useMatches({
    select: (matches) => deepestTitle(matches),
  })
  const footer = useMatches({
    select: (matches) => deepestStaticValue(matches, 'footer') ?? true,
  })
  const mobileTabBar = useMatches({
    select: (matches) => deepestStaticValue(matches, 'mobileTabBar') ?? false,
  })

  return useMemo(() => ({ title, footer, mobileTabBar }), [title, footer, mobileTabBar])
}
