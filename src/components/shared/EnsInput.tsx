import type { ChangeEvent } from 'react'

import { AUTH_INPUT_CLASS } from '@/components/shared/authStyles'
import type { FieldProps } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ENS_SUFFIX } from '@/schemas/profile'
import { cn } from '@/lib/utils'

type EnsInputProps = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  suffix?: string
  field: FieldProps
  disabled?: boolean
  name?: string
}

// Nome ENS: o sufixo fixo à esquerda e o nome digitado à direita.
export function EnsInput({
  value,
  onChange,
  onBlur,
  suffix = ENS_SUFFIX,
  field,
  disabled,
  name,
}: EnsInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value)
  }

  return (
    <div className="flex items-center gap-2.5">
      <Select value={suffix} disabled={disabled}>
        <SelectTrigger
          aria-label="Sufixo ENS"
          className={cn('w-[78px] shrink-0 text-sm max-lg:w-21 max-lg:rounded-3xl')}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={suffix}>{suffix}</SelectItem>
        </SelectContent>
      </Select>
      <Input
        {...field}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        className={cn(AUTH_INPUT_CLASS, 'min-w-0 flex-1')}
      />
    </div>
  )
}
