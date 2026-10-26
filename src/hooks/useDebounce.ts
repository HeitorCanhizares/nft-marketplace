import { useEffect, useState } from 'react'

// Devolve o valor só depois de `delayMs` sem mudanças. O primeiro valor é o inicial, sem atraso.
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
