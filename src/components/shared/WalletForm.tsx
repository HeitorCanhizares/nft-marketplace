import { Controller, type UseFormReturn } from 'react-hook-form'

import { AUTH_INPUT_CLASS } from '@/components/shared/authStyles'
import { EnsInput } from '@/components/shared/EnsInput'
import { FormField } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { NETWORK_OPTIONS, PROVIDER_OPTIONS } from '@/lib/walletOptions'
import type { WalletFormValues } from '@/schemas/wallet'

export type WalletFieldKey = keyof WalletFormValues

type WalletFormProps = {
  variant: 'wallets' | 'checkout'
  form: UseFormReturn<WalletFormValues>
  serverErrors: Partial<Record<WalletFieldKey, string>>
  disabled?: boolean
  className?: string
}

const FIELD_CLASS = 'gap-[3px] max-lg:gap-2'

// Formulário de carteira sem botão e sem envio: o dono cuida do useForm, do botão e das mensagens.
export function WalletForm({ variant, form, serverErrors, disabled, className }: WalletFormProps) {
  const { register, control } = form
  const { errors } = form.formState

  return (
    <div className={cn('grid gap-x-7 gap-y-[31px] max-lg:gap-4 lg:grid-cols-2', className)}>
      <FormField
        label="Nome de exibição"
        required
        plain
        className={FIELD_CLASS}
        error={errors.displayName?.message ?? serverErrors.displayName}
      >
        {(field) => (
          <Input
            {...field}
            {...register('displayName')}
            disabled={disabled}
            autoComplete="nickname"
            className={AUTH_INPUT_CLASS}
          />
        )}
      </FormField>

      {variant === 'wallets' ? (
        <FormField
          label="Apelido da carteira"
          required
          plain
          className={FIELD_CLASS}
          error={errors.nickname?.message ?? serverErrors.nickname}
        >
          {(field) => (
            <Input
              {...field}
              {...register('nickname')}
              disabled={disabled}
              autoComplete="off"
              className={AUTH_INPUT_CLASS}
            />
          )}
        </FormField>
      ) : (
        <FormField
          label="Nome de usuário"
          required
          plain
          className={FIELD_CLASS}
          error={errors.username?.message ?? serverErrors.username}
        >
          {(field) => (
            <Input
              {...field}
              {...register('username')}
              disabled={disabled}
              autoComplete="username"
              className={AUTH_INPUT_CLASS}
            />
          )}
        </FormField>
      )}

      <FormField
        label="Rede"
        required
        plain
        className={FIELD_CLASS}
        error={errors.network?.message ?? serverErrors.network}
      >
        {(field) => (
          <Controller
            name="network"
            control={control}
            render={({ field: select }) => (
              <Select
                value={select.value}
                disabled={disabled}
                onValueChange={(value) => {
                  select.onChange(value)
                  select.onBlur()
                }}
              >
                <SelectTrigger
                  ref={select.ref}
                  id={field.id}
                  aria-describedby={field['aria-describedby']}
                  aria-invalid={field['aria-invalid']}
                  aria-required={field['aria-required']}
                  className={AUTH_INPUT_CLASS}
                >
                  <SelectValue placeholder="Selecione uma rede" />
                </SelectTrigger>
                <SelectContent>
                  {NETWORK_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </FormField>

      <FormField
        label="Nome do perfil"
        required
        plain
        className={FIELD_CLASS}
        error={errors.profileName?.message ?? serverErrors.profileName}
      >
        {(field) => (
          <Input
            {...field}
            {...register('profileName')}
            disabled={disabled}
            className={AUTH_INPUT_CLASS}
          />
        )}
      </FormField>

      <FormField
        label="Endereço da carteira"
        required
        plain
        className={FIELD_CLASS}
        error={errors.address?.message ?? serverErrors.address}
      >
        {(field) => (
          <Input
            {...field}
            {...register('address')}
            disabled={disabled}
            placeholder="Endereço 0x da carteira"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="text"
            className={AUTH_INPUT_CLASS}
          />
        )}
      </FormField>

      <FormField
        label="ENS ou carteira secundária"
        hideLabel
        plain
        className={cn(FIELD_CLASS, 'self-end')}
        error={errors.secondaryAddressOrEns?.message ?? serverErrors.secondaryAddressOrEns}
      >
        {(field) => (
          <Input
            {...field}
            {...register('secondaryAddressOrEns')}
            disabled={disabled}
            placeholder="ENS ou carteira secundária (opcional)"
            autoCapitalize="none"
            spellCheck={false}
            className={AUTH_INPUT_CLASS}
          />
        )}
      </FormField>

      <FormField
        label="Tipo de carteira"
        required
        plain
        className={FIELD_CLASS}
        error={errors.provider?.message ?? serverErrors.provider}
      >
        {(field) => (
          <Controller
            name="provider"
            control={control}
            render={({ field: select }) => (
              <Select
                value={select.value}
                disabled={disabled}
                onValueChange={(value) => {
                  select.onChange(value)
                  select.onBlur()
                }}
              >
                <SelectTrigger
                  ref={select.ref}
                  id={field.id}
                  aria-describedby={field['aria-describedby']}
                  aria-invalid={field['aria-invalid']}
                  aria-required={field['aria-required']}
                  className={AUTH_INPUT_CLASS}
                >
                  <SelectValue placeholder="Selecione uma carteira" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </FormField>

      <FormField
        label="Código de indicação"
        required
        plain
        className={FIELD_CLASS}
        error={errors.referralCode?.message ?? serverErrors.referralCode}
      >
        {(field) => (
          <Input
            {...field}
            {...register('referralCode')}
            disabled={disabled}
            className={AUTH_INPUT_CLASS}
          />
        )}
      </FormField>

      <FormField
        label="E-mail"
        required
        plain
        className={FIELD_CLASS}
        error={errors.email?.message ?? serverErrors.email}
      >
        {(field) => (
          <Input
            {...field}
            {...register('email')}
            disabled={disabled}
            type="email"
            inputMode="email"
            autoComplete="email"
            className={AUTH_INPUT_CLASS}
          />
        )}
      </FormField>

      <FormField
        label="Nome ENS"
        required
        plain
        className={FIELD_CLASS}
        error={errors.ensLabel?.message ?? serverErrors.ensLabel}
      >
        {(field) => (
          <Controller
            name="ensLabel"
            control={control}
            render={({ field: ens }) => (
              <EnsInput
                field={field}
                name={ens.name}
                value={ens.value}
                onChange={ens.onChange}
                onBlur={ens.onBlur}
                disabled={disabled}
              />
            )}
          />
        )}
      </FormField>
    </div>
  )
}
