/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MOCKING: 'enabled' | 'disabled'
  readonly VITE_API_BASE_URL: string
  readonly VITE_MOCK_LATENCY_MIN_MS: string
  readonly VITE_MOCK_LATENCY_MAX_MS: string
  readonly VITE_MOCK_ERROR_RATE: string
  readonly VITE_MOCK_NETWORK_ERROR_RATE: string
  readonly VITE_MOCK_SESSION_TTL_SECONDS: string
  readonly VITE_MOCK_QUOTE_TTL_SECONDS: string
  readonly VITE_MOCK_PAYMENT_DELAY_MS: string
  readonly VITE_MOCK_PAYMENT_DECLINE_RATE: string
  readonly VITE_MOCK_REALTIME: 'enabled' | 'disabled'
  readonly VITE_MOCK_SCENARIOS: string
  readonly VITE_MOCK_SEED_RESET: 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
