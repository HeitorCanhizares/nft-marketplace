import { QueryClient } from '@tanstack/react-query'

import { isRetryable } from '@/services/http/ApiError'

export const QUERY_STALE_TIME_MS = 30_000
export const QUERY_MAX_RETRIES = 2

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        retry: (failureCount, error) => failureCount < QUERY_MAX_RETRIES && isRetryable(error),
        retryDelay: (failureCount) => 500 * 2 ** failureCount,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export const queryClient = createQueryClient()
