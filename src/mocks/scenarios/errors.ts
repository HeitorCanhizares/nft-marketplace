import { HttpResponse } from 'msw'
import type { ApiErrorBody, ApiErrorCode } from '../../types/api'

export type ApiErrorOptions = {
  message?: string
  fields?: Record<string, string>
  details?: Record<string, unknown>
}

// Tabela de docs/api-mock/contratos.md (seção "Formato de erro").
const ERROR_STATUS: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  SESSION_EXPIRED: 401,
  INVALID_CREDENTIALS: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_ATTEMPTS: 429,
  EMAIL_TAKEN: 409,
  USERNAME_TAKEN: 409,
  SOLD_OUT: 409,
  QUOTE_CHANGED: 409,
  QUOTE_EXPIRED: 409,
  CART_CHANGED: 409,
  VALIDATION_ERROR: 422,
  COUPON_INVALID: 422,
  COUPON_EXPIRED: 422,
  INVALID_CURRENT_PASSWORD: 422,
  IDEMPOTENCY_KEY_REUSED: 422,
  QUANTITY_EXCEEDS_STOCK: 422,
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
}

const DEFAULT_MESSAGES: Record<ApiErrorCode, string> = {
  BAD_REQUEST: 'Requisição inválida.',
  UNAUTHORIZED: 'Entre na sua conta para continuar.',
  SESSION_EXPIRED: 'Sua sessão expirou. Entre novamente.',
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  FORBIDDEN: 'Você não tem permissão para acessar isto.',
  NOT_FOUND: 'Não encontramos o que você procura.',
  TOO_MANY_ATTEMPTS: 'Muitas tentativas. Aguarde e tente novamente.',
  EMAIL_TAKEN: 'Este e-mail já está em uso.',
  USERNAME_TAKEN: 'Este nome de usuário já está em uso.',
  SOLD_OUT: 'Este item esgotou.',
  QUOTE_CHANGED: 'A cotação mudou. Confira os novos valores.',
  QUOTE_EXPIRED: 'A cotação expirou. Gere uma nova cotação.',
  CART_CHANGED: 'Seu carrinho mudou. Revise antes de continuar.',
  VALIDATION_ERROR: 'Revise os dados informados.',
  COUPON_INVALID: 'Cupom inválido.',
  COUPON_EXPIRED: 'Este cupom expirou.',
  INVALID_CURRENT_PASSWORD: 'A senha atual está incorreta.',
  IDEMPOTENCY_KEY_REUSED: 'Esta requisição já foi enviada com outros dados.',
  QUANTITY_EXCEEDS_STOCK: 'A quantidade excede o estoque disponível.',
  INTERNAL_ERROR: 'Algo deu errado. Tente novamente.',
  BAD_GATEWAY: 'Falha de comunicação. Tente novamente.',
  SERVICE_UNAVAILABLE: 'Serviço indisponível no momento.',
}

export function apiError(code: ApiErrorCode, options: ApiErrorOptions = {}): Response {
  const body: ApiErrorBody = {
    error: {
      code,
      message: options.message ?? DEFAULT_MESSAGES[code],
      details: options.details ?? {},
      ...(options.fields === undefined ? {} : { fields: options.fields }),
    },
  }
  return HttpResponse.json(body, { status: ERROR_STATUS[code] })
}

export function networkError(): Response {
  return HttpResponse.error()
}

const SERVER_ERROR_CODES = ['INTERNAL_ERROR', 'BAD_GATEWAY', 'SERVICE_UNAVAILABLE'] as const

export function randomServerError(): Response {
  const code = SERVER_ERROR_CODES[Math.floor(Math.random() * SERVER_ERROR_CODES.length)]
  return apiError(code)
}
