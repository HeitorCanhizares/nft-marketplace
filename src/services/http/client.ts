import axios from 'axios'
import { STORAGE_KEYS, storage } from '@/lib/storage'
import { toApiError } from './ApiError'
import { emitSessionExpired } from './sessionEvents'

export const HTTP_TIMEOUT_MS = 10_000

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: HTTP_TIMEOUT_MS,
})

http.interceptors.request.use((config) => {
  const session = storage.local.getJson<{ token: string }>(STORAGE_KEYS.session)

  if (session?.token) {
    config.headers.set('Authorization', `Bearer ${session.token}`)
    return config
  }

  const guestCartId = storage.local.get(STORAGE_KEYS.guestCartId)
  if (guestCartId) {
    config.headers.set('X-Cart-Id', guestCartId)
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)

    if (apiError.code === 'SESSION_EXPIRED') {
      emitSessionExpired()
    }

    return Promise.reject(apiError)
  },
)
