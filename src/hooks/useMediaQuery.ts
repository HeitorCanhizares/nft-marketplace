import { useSyncExternalStore } from 'react'

export const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'

function getMediaQueryList(query: string): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null
  }
  return window.matchMedia(query)
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mediaQueryList = getMediaQueryList(query)
      if (!mediaQueryList) {
        return () => {}
      }
      mediaQueryList.addEventListener('change', onChange)
      return () => {
        mediaQueryList.removeEventListener('change', onChange)
      }
    },
    () => getMediaQueryList(query)?.matches ?? false,
    () => false,
  )
}

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_MEDIA_QUERY)
}
