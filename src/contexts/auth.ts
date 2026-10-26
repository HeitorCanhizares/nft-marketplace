import { createContext, useContext } from 'react'

import type { LoginInput, RegisterInput } from '@/services/api/auth'
import type { CartAdjustment } from '@/types/cart'
import type { Session, User } from '@/types/user'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthState {
  status: AuthStatus
  // Identidade da sessão. Nada além disso vem da API para cá.
  user: User | null
  expiresAt: string | null
  // true quando faltam 2 minutos ou menos para a expiração (aviso de sessão).
  expiryWarning: boolean
}

// Resposta de login e cadastro (mesmo formato). details.adjustments: ajustes do carrinho mesclado.
export interface AuthResponse {
  user: User
  session: Session
  details?: { adjustments?: CartAdjustment[] }
}

export interface AuthContextValue extends AuthState {
  signIn: (credentials: LoginInput) => Promise<AuthResponse>
  signUp: (data: RegisterInput) => Promise<AuthResponse>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  }

  return context
}
