import { useEffect, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDeferredEmptyValidation } from '@/hooks/useDeferredEmptyValidation'
import { couponFormSchema, type CouponFormValues } from '@/schemas/cart'
import { cn } from '@/lib/utils'

export type CouponSummary = {
  code: string
  status: 'applied' | 'expired'
  message?: string
}

export type CouponFieldProps = {
  coupon?: CouponSummary
  onApply: (code: string) => void
  onRemove: () => void
  isApplying: boolean
  isRemoving: boolean
  error: { message: string } | null
  labelHidden?: boolean
  variant: 'desktop' | 'mobile'
}

// Campo de cupom. Com cupom guardado, mostra o código (ou o aviso de expirado) e "Remover cupom".
export function CouponField({
  coupon,
  onApply,
  onRemove,
  isApplying,
  isRemoving,
  error,
  labelHidden = false,
  variant,
}: CouponFieldProps) {
  const [resolver, markSubmitAttempt] = useDeferredEmptyValidation<CouponFormValues>(
    zodResolver(couponFormSchema),
  )
  const form = useForm<CouponFormValues>({
    resolver,
    mode: 'onTouched',
    defaultValues: { code: '' },
  })
  const { register, setFocus } = form
  const formError = form.formState.errors.code?.message

  // Erro do servidor: o foco volta ao campo. Efeito, nunca ref lido no render.
  useEffect(() => {
    if (error !== null) setFocus('code')
  }, [error, setFocus])

  function handleValid(values: CouponFormValues) {
    if (isApplying) return
    onApply(values.code)
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    markSubmitAttempt()
    void form.handleSubmit(handleValid)(event)
  }

  if (coupon !== undefined) {
    return (
      <div className="flex flex-col gap-1">
        {coupon.status === 'expired' ? (
          <p className="text-caption-md text-destructive">
            {coupon.message ?? 'Este código promocional expirou.'}
          </p>
        ) : (
          <p className="text-caption-md text-success">Cupom {coupon.code} aplicado</p>
        )}
        <Button
          type="button"
          variant="link"
          aria-label={`Remover cupom ${coupon.code}`}
          aria-busy={isRemoving}
          disabled={isRemoving}
          onClick={onRemove}
          className="min-h-11 justify-start"
        >
          Remover cupom
        </Button>
      </div>
    )
  }

  const isMobile = variant === 'mobile'

  return (
    <form onSubmit={handleFormSubmit} noValidate className="flex flex-col">
      <FormField
        label="Código promocional"
        hideLabel={labelHidden}
        error={formError ?? error?.message}
      >
        {(field) => (
          <div className={cn('flex', isMobile && 'gap-2')}>
            <Input
              {...field}
              {...register('code')}
              type="text"
              autoComplete="off"
              placeholder="Digite o código promocional..."
              className={cn(
                'min-w-0 flex-1 text-caption-md',
                isMobile ? 'rounded-full px-4' : 'rounded-r-none',
              )}
            />
            <Button
              type="submit"
              variant={isMobile ? 'gradient' : 'default'}
              aria-busy={isApplying}
              className={cn('min-h-11 shrink-0', isMobile ? 'rounded-full px-5' : 'rounded-l-none')}
            >
              Aplicar
            </Button>
          </div>
        )}
      </FormField>
    </form>
  )
}
