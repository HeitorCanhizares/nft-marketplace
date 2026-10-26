import { useCallback, useRef, useState } from 'react'
import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form'

// Regra dos formulários do projeto: campo vazio só é validado no envio. Sair de um campo vazio não
// mostra "obrigatório" (a mensagem empurraria o layout sob o mouse e o clique se perderia); erros de
// formato e de regra continuam aparecendo ao sair do campo.
//
// Uso: envolve o resolver do zod e chama `markSubmitAttempt()` antes de `handleSubmit`.
//   const [resolver, markSubmitAttempt] = useDeferredEmptyValidation<Values>(zodResolver(schema))
export function useDeferredEmptyValidation<TFieldValues extends FieldValues>(
  base: Resolver<TFieldValues>,
): [Resolver<TFieldValues>, () => void] {
  const attempted = useRef(false)

  const [resolver] = useState(() => {
    const deferred: Resolver<TFieldValues> = async (values, context, options) => {
      const result = await base(values, context, options)
      if (attempted.current) return result

      const remaining: Record<string, unknown> = {}
      for (const [name, error] of Object.entries(result.errors)) {
        const value: unknown = (values as Record<string, unknown>)[name]
        if (value !== '') remaining[name] = error
      }
      if (Object.keys(remaining).length > 0) {
        return { values: {}, errors: remaining as FieldErrors<TFieldValues> }
      }
      return { values, errors: {} } as Awaited<ReturnType<Resolver<TFieldValues>>>
    }
    return deferred
  })

  const markSubmitAttempt = useCallback(() => {
    attempted.current = true
  }, [])

  return [resolver, markSubmitAttempt]
}
