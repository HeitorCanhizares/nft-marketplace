import { z } from 'zod'
import { emailSchema, passwordSchema, usernameSchema } from '@/schemas/common'

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string({ error: 'Informe sua senha.' }).min(1, { error: 'Informe sua senha.' }),
})

export const registerBodySchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
})

export const availabilityBodySchema = z.union([
  z.strictObject({ email: emailSchema }),
  z.strictObject({ username: usernameSchema }),
])

export const loginFormSchema = loginBodySchema

export const signupFormSchema = registerBodySchema
  .extend({
    confirmPassword: z
      .string({ error: 'Confirme sua senha.' })
      .min(1, { error: 'Confirme sua senha.' }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    error: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export type LoginFormValues = z.input<typeof loginFormSchema>
export type SignupFormValues = z.input<typeof signupFormSchema>
export type LoginBody = z.output<typeof loginBodySchema>
export type RegisterBody = z.output<typeof registerBodySchema>

export type PasswordRuleId = 'length' | 'letter' | 'number'

export type PasswordRule = {
  id: PasswordRuleId
  label: string
  test: (value: string) => boolean
}

// Fonte única das regras de composição da senha; deve concordar com passwordSchema.
export const PASSWORD_RULES: readonly PasswordRule[] = [
  { id: 'length', label: '8+ caracteres', test: (value) => value.length >= 8 },
  { id: 'letter', label: 'letra', test: (value) => /\p{L}/u.test(value) },
  { id: 'number', label: 'número', test: (value) => /\d/.test(value) },
]
