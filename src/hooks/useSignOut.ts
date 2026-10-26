import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/contexts/auth'

// Navega antes de encerrar a sessão: a página privada sai da tela antes de o estado virar anônimo.
export function useSignOut(): () => Promise<void> {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  return useCallback(async () => {
    await navigate({ to: '/' })
    await signOut()
  }, [navigate, signOut])
}
