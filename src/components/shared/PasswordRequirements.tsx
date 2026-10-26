import { CheckIcon, CircleIcon } from 'lucide-react'

import { PASSWORD_RULES } from '@/schemas/auth'
import { cn } from '@/lib/utils'

type PasswordRequirementsProps = {
  value: string
  className?: string
}

// Sem aria-live: a lista é lida quando o campo ganha foco (pela descrição), não a cada tecla.
export function PasswordRequirements({ value, className }: PasswordRequirementsProps) {
  return (
    <div className={cn('text-caption', className)}>
      <span className="sr-only">A senha deve ter:</span>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(value)

          return (
            <li
              key={rule.id}
              className={cn('flex items-center gap-1', met ? 'text-success' : 'text-tan')}
            >
              {met ? (
                <CheckIcon aria-hidden="true" className="size-3.5 shrink-0" />
              ) : (
                <CircleIcon aria-hidden="true" className="size-3.5 shrink-0" />
              )}
              <span>{rule.label}</span>
              <span className="sr-only">{met ? ', cumprido' : ', pendente'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
