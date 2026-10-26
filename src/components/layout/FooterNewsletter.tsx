import { useId, type FormEvent } from 'react'

import { ComingSoon } from '@/components/shared/ComingSoon'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Newsletter desabilitada por decisão do usuário: campo e botão visíveis, sem envio.
export function FooterNewsletter() {
  const inputId = useId()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <form aria-label="Newsletter" onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-foreground">Antecipe-se ao próximo lançamento</h2>

      <div className="flex items-center gap-2">
        <Label htmlFor={inputId} className="sr-only">
          E-mail para a newsletter
        </Label>
        <Input
          id={inputId}
          type="email"
          placeholder="digite seu e-mail..."
          disabled
          className="h-10 w-60 min-w-0 shrink"
        />
        <ComingSoon className={cn(buttonVariants(), 'h-10 w-21.25 shrink-0')}>Enviar</ComingSoon>
      </div>

      <p className="text-sm leading-5.5 text-muted-foreground">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
    </form>
  )
}
