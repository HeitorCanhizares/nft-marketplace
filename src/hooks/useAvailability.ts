import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { emailSchema, usernameSchema } from '@/schemas/common'
import { isApiError } from '@/services/http/ApiError'
import { checkAvailability, type AvailabilityInput } from '@/services/api/auth'

export type AvailabilityField = 'email' | 'username'

export type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'unknown'

const DEBOUNCE_MS = 300

const fieldSchemas = {
  email: emailSchema,
  username: usernameSchema,
} as const

// Consulta de disponibilidade com debounce, cancelamento e descarte de respostas antigas.
export function useAvailability(field: AvailabilityField) {
  const [status, setStatus] = useState<AvailabilityStatus>('idle')
  const timerRef = useRef<number | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  // Só limpa a consulta pendente; não mexe no estado (usado também na desmontagem).
  const clearPending = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    controllerRef.current?.abort()
    controllerRef.current = null
  }, [])

  const cancel = useCallback(() => {
    clearPending()
    setStatus('idle')
  }, [clearPending])

  const check = useCallback(
    (value: string) => {
      clearPending()

      const parsed = fieldSchemas[field].safeParse(value.trim())
      if (!parsed.success) {
        setStatus('idle')
        return
      }

      const normalized = parsed.data
      const controller = new AbortController()
      controllerRef.current = controller
      setStatus('checking')

      const input: AvailabilityInput =
        field === 'email' ? { email: normalized } : { username: normalized }

      timerRef.current = window.setTimeout(() => {
        timerRef.current = null

        checkAvailability(input, controller.signal)
          .then((response) => {
            if (controllerRef.current !== controller) return
            setStatus(response.available ? 'available' : 'taken')
          })
          .catch((error: unknown) => {
            if (controllerRef.current !== controller) return
            if (isApiError(error) && error.code === 'CANCELED') return
            // Silencioso: falha da consulta não bloqueia o envio (o 409 cobre).
            setStatus('unknown')
          })
      }, DEBOUNCE_MS)
    },
    [field, clearPending],
  )

  useEffect(() => clearPending, [clearPending])

  return useMemo(() => ({ status, check, cancel }), [status, check, cancel])
}
