import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

import { useAuth } from '@/contexts/auth'
import { profile } from '@/hooks/queryKeys'
import type { ProfileBody } from '@/schemas/profile'
import { getProfile, updateProfile } from '@/services/api/profile'
import type { User } from '@/types/user'

const UPDATE_PROFILE_KEY = ['update-profile'] as const

export function useProfile() {
  return useQuery({
    queryKey: profile,
    queryFn: ({ signal }) => getProfile(signal),
  })
}

// Salvar dados do perfil. Sem toast: quem anuncia é o useProfileSave.
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { updateUser } = useAuth()
  const inFlight = useRef<Promise<User> | null>(null)

  const mutation = useMutation({
    mutationKey: UPDATE_PROFILE_KEY,
    mutationFn: (body: ProfileBody) => updateProfile(body),
    onSuccess: (user) => {
      queryClient.setQueryData(profile, user)
      updateUser(user)
    },
  })

  // Trava de clique repetido: enquanto houver envio em andamento, devolve a mesma promessa.
  function mutateAsync(body: ProfileBody): Promise<User> {
    if (queryClient.isMutating({ mutationKey: UPDATE_PROFILE_KEY }) > 0 && inFlight.current) {
      return inFlight.current
    }
    const promise = mutation.mutateAsync(body)
    inFlight.current = promise
    return promise
  }

  return { mutateAsync, isPending: mutation.isPending }
}
