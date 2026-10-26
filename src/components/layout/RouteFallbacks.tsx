import { useState } from 'react'
import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { isApiError } from '@/services/http/ApiError'

const NOT_FOUND_TITLE = 'Página não encontrada'
const NOT_FOUND_DESCRIPTION = 'O endereço que você abriu não existe ou foi removido.'
const ERROR_TITLE = 'Algo deu errado'
const ERROR_MESSAGE =
  'Não foi possível carregar este conteúdo. Verifique sua conexão e tente novamente.'

export function RouteNotFound() {
  return (
    <div className="container-page">
      <EmptyState
        as="h1"
        title={NOT_FOUND_TITLE}
        description={NOT_FOUND_DESCRIPTION}
        action={
          <Button asChild>
            <Link to="/">Voltar para o início</Link>
          </Button>
        }
      />
    </div>
  )
}

export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const [retrying, setRetrying] = useState(false)

  // Só mensagens vindas do servidor (status HTTP real) são exibidas; erros de cliente usam o texto padrão.
  const serverMessage = isApiError(error) && error.status > 0 ? error.message : undefined

  async function handleRetry() {
    setRetrying(true)
    try {
      reset()
      await router.invalidate()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <ErrorState
      as="h1"
      title={ERROR_TITLE}
      message={serverMessage ?? ERROR_MESSAGE}
      onRetry={handleRetry}
      retrying={retrying}
    />
  )
}

export function RoutePending() {
  return <PageSkeleton />
}
