import { useNavigate } from '@tanstack/react-router'

import { AuthDialog } from '@/components/shared/AuthDialog'
import { AuthForm } from '@/components/shared/AuthForm'
import { SignupForm } from '@/components/shared/SignupForm'
import { useAuth } from '@/contexts/auth'
import { useAuthSuccess } from '@/hooks/useAuthSuccess'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { closeTarget } from '@/lib/redirect'
import { Home } from '@/pages/Home/Home'
import type { SignupFormValues } from '@/schemas/auth'

type SignUpProps = {
  redirect?: string
}

export function SignUp({ redirect }: SignUpProps) {
  const { signUp } = useAuth()
  const finishAuth = useAuthSuccess()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()

  async function handleSubmit(values: SignupFormValues) {
    // A confirmação de senha nunca vai para a API.
    const body = {
      username: values.username,
      email: values.email,
      password: values.password,
    }
    const response = await signUp(body)
    await finishAuth(response, {
      welcome: `Conta criada. Bem-vindo(a), ${response.user.username}!`,
    })
    // Sem navegação aqui: a guarda de rota (requireGuest) leva ao redirect assim que a sessão muda.
  }

  function handleClose() {
    void navigate({ href: closeTarget(redirect), state: { skipRouteFocus: true } })
  }

  if (!isDesktop) {
    return (
      <AuthForm mode="signup" variant="mobile" redirect={redirect}>
        <SignupForm variant="mobile" onSubmit={handleSubmit} redirect={redirect} />
      </AuthForm>
    )
  }

  return (
    <>
      <Home />
      <AuthDialog title="Criar conta" onClose={handleClose}>
        <AuthForm mode="signup" variant="desktop" redirect={redirect}>
          <SignupForm variant="desktop" onSubmit={handleSubmit} redirect={redirect} />
        </AuthForm>
      </AuthDialog>
    </>
  )
}
