import { z } from 'zod'
import type { ApiErrorBody, ApiErrorCode } from '@/types/api'

const apiErrorCodeValues = [
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'SESSION_EXPIRED',
  'INVALID_CREDENTIALS',
  'FORBIDDEN',
  'NOT_FOUND',
  'TOO_MANY_ATTEMPTS',
  'EMAIL_TAKEN',
  'USERNAME_TAKEN',
  'SOLD_OUT',
  'QUOTE_CHANGED',
  'QUOTE_EXPIRED',
  'CART_CHANGED',
  'VALIDATION_ERROR',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'INVALID_CURRENT_PASSWORD',
  'IDEMPOTENCY_KEY_REUSED',
  'QUANTITY_EXCEEDS_STOCK',
  'INTERNAL_ERROR',
  'BAD_GATEWAY',
  'SERVICE_UNAVAILABLE',
] as const satisfies readonly ApiErrorCode[]

// Falha de compilação se algum código de ApiErrorCode ficar fora da lista acima.
export const apiErrorCodesComplete: [
  Exclude<ApiErrorCode, (typeof apiErrorCodeValues)[number]>,
] extends [never]
  ? true
  : false = true

export const apiErrorCodeSchema: z.ZodType<ApiErrorCode> = z.enum(apiErrorCodeValues)

export const apiErrorBodySchema: z.ZodType<ApiErrorBody> = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
})
