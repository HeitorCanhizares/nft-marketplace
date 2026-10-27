import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

import type { ChangePasswordBody } from '@/schemas/profile'
import { changePassword } from '@/services/api/profile'

const CHANGE_PASSWORD_KEY = ['change-password'] as const

// Trocar a senha. Sem toast: quem anuncia é o useProfileSave.
export function useChangePassword() {
  const queryClient = useQueryClient()
  const inFlight = useRef<Promise<void> | null>(null)

  const mutation = useMutation({
    mutationKey: CHANGE_PASSWORD_KEY,
    mutationFn: (body: ChangePasswordBody) => changePassword(body),
  })

  // Trava de clique repetido: enquanto houver envio em andamento, devolve a mesma promessa.
  function mutateAsync(body: ChangePasswordBody): Promise<void> {
    if (queryClient.isMutating({ mutationKey: CHANGE_PASSWORD_KEY }) > 0 && inFlight.current) {
      return inFlight.current
    }
    const promise = mutation.mutateAsync(body)
    inFlight.current = promise
    return promise
  }

  return { mutateAsync, isPending: mutation.isPending }
}
