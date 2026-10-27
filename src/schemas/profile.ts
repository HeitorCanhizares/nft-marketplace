import { z } from 'zod'
import type { User } from '@/types/user'
import { passwordSchema, emailSchema, usernameSchema } from '@/schemas/common'

export const ENS_SUFFIX = '.eth'
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

const ENS_LABEL_REGEX = /^[a-z0-9-]{3,63}$/

export const displayNameSchema = z
  .string({ error: 'Informe um nome de exibição.' })
  .trim()
  .min(1, { error: 'Informe um nome de exibição.' })
  .max(40, { error: 'O nome de exibição deve ter até 40 caracteres.' })

export const walletNicknameSchema = z
  .string({ error: 'O apelido deve ter até 30 caracteres.' })
  .trim()
  .max(30, { error: 'O apelido deve ter até 30 caracteres.' })

export const ensLabelSchema = z
  .string({ error: 'Use de 3 a 63 letras minúsculas, números ou hífens.' })
  .trim()
  .refine((value) => value === '' || ENS_LABEL_REGEX.test(value), {
    error: 'Use de 3 a 63 letras minúsculas, números ou hífens.',
  })

const ensNameBodySchema = z
  .string({ error: 'Use de 3 a 63 letras minúsculas, números ou hífens.' })
  .regex(/^([a-z0-9-]{3,63}\.eth)?$/, {
    error: 'Use de 3 a 63 letras minúsculas, números ou hífens.',
  })

// Corpo do PATCH /profile. Vazio em ensName e walletNickname limpa o campo.
export const profileBodySchema = z.object({
  displayName: displayNameSchema,
  username: usernameSchema,
  email: emailSchema,
  ensName: ensNameBodySchema.optional(),
  walletNickname: walletNicknameSchema.optional(),
  currentPassword: z
    .string({ error: 'Informe sua senha atual.' })
    .min(1, { error: 'Informe sua senha atual.' })
    .optional(),
})

export type ProfileBody = z.output<typeof profileBodySchema>

// Corpo do POST /profile/password.
export const changePasswordBodySchema = z
  .object({
    currentPassword: z
      .string({ error: 'Informe sua senha atual.' })
      .min(1, { error: 'Informe sua senha atual.' }),
    newPassword: passwordSchema,
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    error: 'A nova senha deve ser diferente da atual.',
    path: ['newPassword'],
  })

export type ChangePasswordBody = z.output<typeof changePasswordBodySchema>

export const avatarResponseSchema: z.ZodType<{ avatarUrl: string }> = z.object({
  avatarUrl: z.string(),
})

// Formulário de perfil: um único schema para dados e senha. Senha só é exigida se algum dos três
// campos de senha estiver preenchido.
export const profileFormSchema = z
  .object({
    displayName: displayNameSchema,
    username: usernameSchema,
    email: emailSchema,
    ensLabel: ensLabelSchema,
    walletNickname: walletNicknameSchema,
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmNewPassword: z.string(),
  })
  .superRefine((values, ctx) => {
    const anyPassword =
      values.currentPassword !== '' || values.newPassword !== '' || values.confirmNewPassword !== ''
    if (!anyPassword) return

    if (values.currentPassword === '') {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe sua senha atual.',
        path: ['currentPassword'],
      })
    }

    const newPasswordResult = passwordSchema.safeParse(values.newPassword)
    if (!newPasswordResult.success) {
      ctx.addIssue({
        code: 'custom',
        message: newPasswordResult.error.issues[0]?.message ?? 'Informe uma senha.',
        path: ['newPassword'],
      })
    } else if (values.currentPassword !== '' && values.newPassword === values.currentPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'A nova senha deve ser diferente da atual.',
        path: ['newPassword'],
      })
    }

    if (values.confirmNewPassword === '') {
      ctx.addIssue({
        code: 'custom',
        message: 'Confirme a nova senha.',
        path: ['confirmNewPassword'],
      })
    } else if (values.confirmNewPassword !== values.newPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'As senhas não coincidem.',
        path: ['confirmNewPassword'],
      })
    }
  })

export type ProfileFormValues = z.input<typeof profileFormSchema>

export function toProfileFormValues(user: User): ProfileFormValues {
  const ensName = user.ensName ?? ''
  const ensLabel = ensName.endsWith(ENS_SUFFIX) ? ensName.slice(0, -ENS_SUFFIX.length) : ensName

  return {
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ensLabel,
    walletNickname: user.walletNickname ?? '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  }
}

export function toEnsName(label: string): string {
  const trimmed = label.trim()
  if (trimmed === '') return ''
  return trimmed.toLowerCase() + ENS_SUFFIX
}
