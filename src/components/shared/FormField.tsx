import { useId, type ReactNode } from 'react'
import { CircleAlertIcon } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type FieldProps = {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  'aria-required'?: true
}

type FormFieldProps = {
  label: string
  hideLabel?: boolean
  required?: boolean
  error?: ReactNode
  description?: ReactNode
  adornment?: ReactNode
  className?: string
  children: (field: FieldProps) => ReactNode
}

export function FormField({
  label,
  hideLabel = false,
  required = false,
  error,
  description,
  adornment,
  className,
  children,
}: FormFieldProps) {
  const baseId = useId()
  const id = `${baseId}-field`
  const descriptionId = `${baseId}-description`
  const errorId = `${baseId}-error`

  const hasError = error !== undefined && error !== null && error !== false && error !== ''
  const hasDescription =
    description !== undefined && description !== null && description !== false && description !== ''

  const describedBy = [hasDescription ? descriptionId : null, hasError ? errorId : null]
    .filter(Boolean)
    .join(' ')

  const fieldProps: FieldProps = {
    id,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': hasError ? true : undefined,
    'aria-required': required ? true : undefined,
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <Label htmlFor={id} className={cn(hideLabel && 'sr-only')}>
        {label}
        {required && !hideLabel && (
          <>
            <span aria-hidden="true" className="text-required">
              {' *'}
            </span>
            <span className="sr-only"> (obrigatório)</span>
          </>
        )}
      </Label>
      <div className="relative">
        {children(fieldProps)}
        {adornment && (
          <div className="absolute inset-y-0 right-4 flex items-center">{adornment}</div>
        )}
      </div>
      {hasDescription && <div id={descriptionId}>{description}</div>}
      {hasError && (
        <div
          id={errorId}
          role="alert"
          className="mt-1 flex items-start gap-1.5 text-caption text-destructive"
        >
          <CircleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
