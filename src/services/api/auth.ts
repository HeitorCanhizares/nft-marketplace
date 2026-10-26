import { get, post } from '@/services/http/validate'
import {
  availabilityResponseSchema,
  loginResponseSchema,
  refreshResponseSchema,
  registerResponseSchema,
  sessionResponseSchema,
} from '@/schemas/user'

export type LoginInput = { email: string; password: string }

export type RegisterInput = { username: string; email: string; password: string }

export type AvailabilityInput = { email: string } | { username: string }

export function login(input: LoginInput) {
  return post('/auth/login', loginResponseSchema, input)
}

export function register(input: RegisterInput) {
  return post('/auth/register', registerResponseSchema, input)
}

export function getSession(signal?: AbortSignal) {
  return get('/auth/session', sessionResponseSchema, { signal })
}

export function refreshSession() {
  return post('/auth/refresh', refreshResponseSchema)
}

export function logout() {
  return post('/auth/logout', null)
}

export function checkAvailability(input: AvailabilityInput, signal?: AbortSignal) {
  return post('/auth/availability', availabilityResponseSchema, input, { signal })
}
