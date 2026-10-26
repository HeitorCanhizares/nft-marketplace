import { useCallback } from 'react'
import { toast } from 'sonner'

import type { AuthResponse } from '@/contexts/auth'
import { describeAdjustments } from '@/lib/cartAdjustments'
import { runPendingAction } from '@/lib/pendingAction'

const ADJUSTMENTS_TOAST_MS = 10_000

type AuthSuccessOptions = { welcome?: string }

// O que acontece depois de entrar ou cadastrar. A navegação é da guarda de rota, não daqui.
export function useAuthSuccess(): (
  response: AuthResponse,
  options?: AuthSuccessOptions,
) => Promise<void> {
  return useCallback(async (response: AuthResponse, options?: AuthSuccessOptions) => {
    try {
      if (options?.welcome) {
        toast.success(options.welcome)
      }

      const adjustments = response.details?.adjustments
      if (adjustments && adjustments.length > 0) {
        toast.warning('Ajustamos o seu carrinho', {
          description: describeAdjustments(adjustments).join(' '),
          duration: ADJUSTMENTS_TOAST_MS,
        })
      }

      const result = await runPendingAction()
      if (result?.ok) {
        toast.success(result.message)
      } else if (result) {
        toast.error(result.message)
      }
    } catch {
      // O login já deu certo: qualquer falha aqui é ignorada.
    }
  }, [])
}
