import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import { AuthTabs } from '@/components/shared/AuthTabs'
import { SocialAuthButtons } from '@/components/shared/SocialAuthButtons'
import { TextDivider } from '@/components/shared/TextDivider'
import { cn } from '@/lib/utils'

type AuthFormProps = {
  mode: 'login' | 'signup'
  variant: 'desktop' | 'mobile'
  redirect?: string
  children: ReactNode
  className?: string
}

const DESKTOP_SUPPORT_TEXT = {
  login: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  signup: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
} as const

const MOBILE_TITLE = {
  login: 'Entrar',
  signup: 'Criar perfil de colecionador',
} as const

const SWITCH_LINK_CLASS = 'font-bold text-foreground underline underline-offset-4'

// Estrutura comum de Login e Cadastro: dentro do modal (desktop) ou da página (mobile). O formulário entra como children.
export function AuthForm({ mode, variant, redirect, children, className }: AuthFormProps) {
  if (variant === 'desktop') {
    return (
      <div className={cn('px-20 pt-12 pb-17.5', className)}>
        <AuthTabs active={mode} redirect={redirect} />
        <p className="mx-auto mt-10 max-w-102.5 text-center text-caption-md leading-4 text-foreground">
          {DESKTOP_SUPPORT_TEXT[mode]}
        </p>
        <div className="mt-6">{children}</div>
        <TextDivider className="-mx-20 mt-6">Ou continue com</TextDivider>
        <SocialAuthButtons className="mt-3.25" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'px-7 pt-[calc(8.25rem+env(safe-area-inset-top))] pb-[calc(2.5rem+env(safe-area-inset-bottom))]',
        className,
      )}
    >
      <Link
        to="/"
        aria-label="Kurio, página inicial"
        className="block text-center text-logo leading-none font-bold tracking-[0.1em] text-foreground"
      >
        KURIO
      </Link>
      <h1 className="mt-22.5 text-center text-xl leading-none font-bold text-foreground">
        {MOBILE_TITLE[mode]}
      </h1>
      <div className="mt-9.5">{children}</div>
      <TextDivider className="mt-10">Ou continue com</TextDivider>
      <SocialAuthButtons className="mt-3.25" />
      <p className="mt-10 text-center text-body text-muted-foreground">
        {mode === 'login' ? (
          <>
            Novo na Kurio?{' '}
            <Link to="/cadastro" search={{ redirect }} className={SWITCH_LINK_CLASS}>
              Crie uma conta
            </Link>
          </>
        ) : (
          <>
            Já tem uma conta?{' '}
            <Link to="/entrar" search={{ redirect }} className={SWITCH_LINK_CLASS}>
              Entre
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
