import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/auth'
import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { profile } from '@/hooks/queryKeys'
import { removeAvatar, uploadAvatar } from '@/services/api/profile'
import type { User } from '@/types/user'

const UPLOAD_AVATAR_KEY = ['upload-avatar'] as const
const REMOVE_AVATAR_KEY = ['remove-avatar'] as const

// Atualiza o cache do perfil e o usuário da sessão a partir do usuário em cache.
function patchCachedUser(
  queryClient: ReturnType<typeof useQueryClient>,
  updateUser: (user: User) => void,
  patch: (current: User) => User,
): void {
  const current = queryClient.getQueryData<User>(profile)
  if (current === undefined) {
    void queryClient.invalidateQueries({ queryKey: profile })
    return
  }
  const next = patch(current)
  queryClient.setQueryData(profile, next)
  updateUser(next)
}

// Erros não viram toast aqui: o AvatarUploader mostra a mensagem e anuncia.
export function useUploadAvatar() {
  const queryClient = useQueryClient()
  const { updateUser } = useAuth()
  const { announce } = useLiveAnnouncer()
  const inFlight = useRef<Promise<{ avatarUrl: string }> | null>(null)

  const mutation = useMutation({
    mutationKey: UPLOAD_AVATAR_KEY,
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: ({ avatarUrl }) => {
      patchCachedUser(queryClient, updateUser, (current) => ({ ...current, avatarUrl }))
      toast.success('Foto de perfil atualizada')
      announce('Foto de perfil atualizada', 'polite')
    },
  })

  // Trava de clique repetido: enquanto houver envio em andamento, devolve a mesma promessa.
  function mutateAsync(file: File): Promise<{ avatarUrl: string }> {
    if (queryClient.isMutating({ mutationKey: UPLOAD_AVATAR_KEY }) > 0 && inFlight.current) {
      return inFlight.current
    }
    const promise = mutation.mutateAsync(file)
    inFlight.current = promise
    return promise
  }

  return { mutateAsync, isPending: mutation.isPending }
}

// Erros não viram toast aqui: o AvatarUploader mostra a mensagem e anuncia.
export function useRemoveAvatar() {
  const queryClient = useQueryClient()
  const { updateUser } = useAuth()
  const { announce } = useLiveAnnouncer()
  const inFlight = useRef<Promise<void> | null>(null)

  const mutation = useMutation({
    mutationKey: REMOVE_AVATAR_KEY,
    mutationFn: () => removeAvatar(),
    onSuccess: () => {
      patchCachedUser(queryClient, updateUser, (current) => {
        const next = { ...current }
        delete next.avatarUrl
        return next
      })
      toast.success('Foto removida')
      announce('Foto removida', 'polite')
    },
  })

  // Trava de clique repetido: enquanto houver envio em andamento, devolve a mesma promessa.
  function mutateAsync(): Promise<void> {
    if (queryClient.isMutating({ mutationKey: REMOVE_AVATAR_KEY }) > 0 && inFlight.current) {
      return inFlight.current
    }
    const promise = mutation.mutateAsync()
    inFlight.current = promise
    return promise
  }

  return { mutateAsync, isPending: mutation.isPending }
}
