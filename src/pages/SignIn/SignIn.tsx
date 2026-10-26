import { useLocation, useNavigate } from '@tanstack/react-router'

import { AuthDialog } from '@/components/shared/AuthDialog'
import { AuthForm } from '@/components/shared/AuthForm'
import { LoginForm } from '@/components/shared/LoginForm'
import { useAuth } from '@/contexts/auth'
import { useAuthSuccess } from '@/hooks/useAuthSuccess'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { closeTarget } from '@/lib/redirect'
import { Home } from '@/pages/Home/Home'
import type { LoginFormValues } from '@/schemas/auth'

type SignInProps = {
  redirect?: string
}

export function SignIn({ redirect }: SignInProps) {
  const { signIn } = useAuth()
  const finishAuth = useAuthSuccess()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  // O e-mail vem do "Entrar com este e-mail" pelo estado de navegação, nunca pela URL.
  const defaultEmail = useLocation({ select: (location) => location.state.email })

  async function handleSubmit(values: LoginFormValues) {
    const response = await signIn(values)
    await finishAuth(response)
    // Sem navegação aqui: a guarda de rota (requireGuest) leva ao redirect assim que a sessão muda.
  }

  function handleClose() {
    void navigate({ href: closeTarget(redirect), state: { skipRouteFocus: true } })
  }

  if (!isDesktop) {
    return (
      <AuthForm mode="login" variant="mobile" redirect={redirect}>
        <LoginForm variant="mobile" onSubmit={handleSubmit} defaultEmail={defaultEmail} />
      </AuthForm>
    )
  }

  return (
    <>
      <Home />
      <AuthDialog title="Entrar" onClose={handleClose}>
        <AuthForm mode="login" variant="desktop" redirect={redirect}>
          <LoginForm variant="desktop" onSubmit={handleSubmit} defaultEmail={defaultEmail} />
        </AuthForm>
      </AuthDialog>
    </>
  )
}
