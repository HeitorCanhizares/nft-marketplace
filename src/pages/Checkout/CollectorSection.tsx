import { useId } from 'react'

import { FormField } from '@/components/shared/FormField'
import { WalletForm } from '@/components/shared/WalletForm'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import type { CheckoutMode } from '@/schemas/checkout'

import type { CheckoutFormApi } from './viewProps'

// Coluna esquerda do desktop: perfil do colecionador, outra carteira e observação.
export function CollectorSection({ form }: { form: CheckoutFormApi }) {
  const headingId = useId()
  const useOtherId = useId()
  const secondaryOptionId = useId()
  const manualOptionId = useId()
  const saveSecondaryId = useId()

  function handleModeChange(value: string) {
    if (value === 'secondary' || value === 'manual') {
      const next: CheckoutMode = value
      form.setMode(next)
    }
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col">
      <h2 id={headingId} className="text-subtitle font-bold text-foreground">
        Perfil do colecionador
      </h2>

      <WalletForm
        variant="checkout"
        form={form.form}
        serverErrors={form.serverErrors}
        className="mt-6 lg:gap-x-6 lg:gap-y-[23px]"
      />

      <div className="mt-6 flex items-center gap-[7px]">
        <Checkbox
          id={useOtherId}
          checked={form.useOther}
          onCheckedChange={(on) => form.setUseOther(on === true)}
          className="rounded-full lg:rounded-full"
        />
        <Label htmlFor={useOtherId} className="text-body font-normal text-foreground">
          Usar outra carteira?
        </Label>
      </div>

      {form.useOther ? (
        <div className="mt-4">
          <RadioGroup
            aria-label="Outra carteira"
            value={form.mode}
            onValueChange={handleModeChange}
            className="gap-3"
          >
            {form.hasSecondary ? (
              <div className="flex items-center gap-[7px]">
                <RadioGroupItem id={secondaryOptionId} value="secondary" />
                <Label
                  htmlFor={secondaryOptionId}
                  className="text-body font-normal text-foreground"
                >
                  Carteira secundária
                </Label>
              </div>
            ) : null}
            <div className="flex items-center gap-[7px]">
              <RadioGroupItem id={manualOptionId} value="manual" />
              <Label htmlFor={manualOptionId} className="text-body font-normal text-foreground">
                Preencher outra carteira
              </Label>
            </div>
          </RadioGroup>

          {form.mode === 'manual' ? (
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-[7px]">
                <Checkbox
                  id={saveSecondaryId}
                  checked={form.saveAsSecondary}
                  onCheckedChange={(on) => form.setSaveAsSecondary(on === true)}
                />
                <Label htmlFor={saveSecondaryId} className="text-body font-normal text-foreground">
                  {form.replacesSecondary
                    ? 'Substituir a carteira secundária'
                    : 'Salvar como carteira secundária'}
                </Label>
              </div>
              {form.replacesSecondary ? (
                <p role="note" className="text-caption text-muted-foreground">
                  A carteira secundária atual será substituída.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <FormField
        label="Observação do colecionador (opcional)"
        plain
        className="mt-7"
        error={form.noteError ?? undefined}
      >
        {(field) => (
          <Textarea
            {...field}
            value={form.note}
            onChange={(event) => form.setNote(event.target.value)}
            maxLength={500}
            className="h-[152px] w-[350px] max-w-full resize-none"
          />
        )}
      </FormField>
    </section>
  )
}
