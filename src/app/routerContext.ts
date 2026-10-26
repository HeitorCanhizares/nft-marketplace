import type { AuthContextValue } from '@/contexts/auth'

// Contexto do roteador: o AppRouter passa o AuthContext. Só o tipo, fora de router.tsx para as rotas importarem sem ciclo.
export type RouterContext = { auth: AuthContextValue }
