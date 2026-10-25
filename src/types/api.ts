export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED'
  | 'INVALID_CREDENTIALS'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'TOO_MANY_ATTEMPTS'
  | 'EMAIL_TAKEN'
  | 'USERNAME_TAKEN'
  | 'SOLD_OUT'
  | 'QUOTE_CHANGED'
  | 'QUOTE_EXPIRED'
  | 'CART_CHANGED'
  | 'VALIDATION_ERROR'
  | 'COUPON_INVALID'
  | 'COUPON_EXPIRED'
  | 'INVALID_CURRENT_PASSWORD'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'QUANTITY_EXCEEDS_STOCK'
  | 'INTERNAL_ERROR'
  | 'BAD_GATEWAY'
  | 'SERVICE_UNAVAILABLE'

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode
    message: string
    fields?: Record<string, string>
    details?: Record<string, unknown>
  }
}
