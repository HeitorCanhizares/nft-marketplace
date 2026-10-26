import { useCallback, useEffect, useState, type FocusEvent } from 'react'

import type { CarouselApi } from '@/components/ui/carousel'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const DEFAULT_INTERVAL_MS = 6000
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

type CarouselAutoplayOptions = { intervalMs?: number }

// Rotação automática do carrossel. Para com hover, foco dentro, pelo botão e com reduced motion.
export function useCarouselAutoplay(
  api: CarouselApi | undefined,
  options?: CarouselAutoplayOptions,
) {
  const intervalMs = options?.intervalMs ?? DEFAULT_INTERVAL_MS

  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY)
  const [userPaused, setUserPaused] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  // Muda a cada select do Embla: reinicia o intervalo.
  const [tick, setTick] = useState(0)

  const running = api !== undefined && !userPaused && !hovering && !focusWithin && !reducedMotion

  const toggle = useCallback(() => {
    setUserPaused((paused) => !paused)
  }, [])

  useEffect(() => {
    if (!api) return

    const onSelect = () => {
      setTick((value) => value + 1)
    }

    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  useEffect(() => {
    if (!api || !running) return

    const timer = setTimeout(() => {
      if (api.canScrollNext()) {
        api.scrollNext()
      } else {
        api.scrollTo(0)
      }
    }, intervalMs)

    return () => {
      clearTimeout(timer)
    }
  }, [api, running, intervalMs, tick])

  const containerProps = {
    onMouseEnter: () => {
      setHovering(true)
    },
    onMouseLeave: () => {
      setHovering(false)
    },
    onFocusCapture: () => {
      setFocusWithin(true)
    },
    onBlurCapture: (event: FocusEvent<HTMLElement>) => {
      const next = event.relatedTarget
      if (next instanceof Node && event.currentTarget.contains(next)) return
      setFocusWithin(false)
    },
  }

  return { reducedMotion, userPaused, toggle, running, containerProps }
}
