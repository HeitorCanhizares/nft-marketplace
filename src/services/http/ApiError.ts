import { isAxiosError, isCancel } from 'axios'
import { apiErrorBodySchema } from '@/schemas/api'
import type { ApiErrorCode } from '@/types/api'

export type ClientErrorCode =
  'NETWORK_ERROR' | 'TIMEOUT' | 'INVALID_RESPONSE' | 'CANCELED' | 'UNKNOWN'

export type ApiErrorInit = {
  status: number
  code: ApiErrorCode | ClientErrorCode
  message: string
  fields?: Record<string, string>
  details?: Record<string, unknown>
}

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode | ClientErrorCode
  readonly fields?: Record<string, string>
  readonly details?: Record<string, unknown>

  constructor({ status, code, message, fields, details }: ApiErrorInit) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
    this.details = details
  }
}

const clientMessages: Record<ClientErrorCode, string> = {
  NETWORK_ERROR: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
  TIMEOUT: 'A requisição demorou demais.',
  INVALID_RESPONSE: 'Resposta inesperada do servidor.',
  CANCELED: 'A requisição foi cancelada.',
  UNKNOWN: 'Não foi possível concluir a ação. Tente novamente.',
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (isCancel(error)) {
    return new ApiError({ status: 0, code: 'CANCELED', message: clientMessages.CANCELED })
  }

  if (isAxiosError(error)) {
    const response = error.response

    if (!response) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return new ApiError({ status: 0, code: 'TIMEOUT', message: clientMessages.TIMEOUT })
      }
      return new ApiError({
        status: 0,
        code: 'NETWORK_ERROR',
        message: clientMessages.NETWORK_ERROR,
      })
    }

    const parsed = apiErrorBodySchema.safeParse(response.data)
    if (parsed.success) {
      const { code, message, fields, details } = parsed.data.error
      return new ApiError({ status: response.status, code, message, fields, details })
    }

    return new ApiError({
      status: response.status,
      code: 'UNKNOWN',
      message: clientMessages.UNKNOWN,
    })
  }

  return new ApiError({ status: 0, code: 'UNKNOWN', message: clientMessages.UNKNOWN })
}

export function isRetryable(error: unknown): boolean {
  const apiError = toApiError(error)
  if (apiError.code === 'NETWORK_ERROR' || apiError.code === 'TIMEOUT') return true
  return apiError.status >= 500 && apiError.status <= 599
}
