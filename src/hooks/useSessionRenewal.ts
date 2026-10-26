import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/auth'
import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { isApiError } from '@/services/http/ApiError'

const WARNING_MESSAGE = 'Sua sessão expira em 2 minutos. Use "Continuar conectado" para renovar.'
const RENEW_ERROR_MESSAGE = 'Não foi possível renovar agora. Tente novamente.'

export type SessionRenewal = {
  open: boolean
  pending: boolean
  error: string | undefined
  renew: () => Promise<void>
}

// Aviso de expiração: anuncia uma vez por aviso e renova a sessão pelo botão.
export function useSessionRenewal(): SessionRenewal {
  const { expiryWarning, refreshSession } = useAuth()
  const { announce } = useLiveAnnouncer()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  // Evita anunciar de novo a cada render enquanto o aviso estiver aberto.
  const announcedRef = useRef(false)
  // Guarda síncrona: um clique repetido durante o envio é ignorado.
  const pendingRef = useRef(false)

  useEffect(() => {
    if (!expiryWarning) {
      announcedRef.current = false
      return
    }
    if (announcedRef.current) return
    announcedRef.current = true
    announce(WARNING_MESSAGE, 'assertive')
  }, [expiryWarning, announce])

  const renew = useCallback(async (): Promise<void> => {
    if (pendingRef.current) return

    pendingRef.current = true
    setPending(true)
    setError(undefined)

    try {
      await refreshSession()
      toast.success('Sessão renovada.')

      // O botão some quando o aviso fecha: devolve o foco ao conteúdo, sem roubar o de um campo em edição.
      const active = document.activeElement
      if (active instanceof HTMLElement && active.closest('[role="alertdialog"]') !== null) {
        document.getElementById('conteudo')?.focus()
      }
    } catch (caught) {
      // 401: o fluxo de expiração já cuida disso.
      if (isApiError(caught) && caught.status === 401) return
      setError(RENEW_ERROR_MESSAGE)
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }, [refreshSession])

  return { open: expiryWarning, pending, error, renew }
}
