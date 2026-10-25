export interface MockConfig {
  readonly mockingEnabled: boolean
  readonly apiBaseUrl: string
  readonly latency: { readonly minMs: number; readonly maxMs: number }
  readonly errorRate: number
  readonly networkErrorRate: number
  readonly sessionTtlSeconds: number
  readonly quoteTtlSeconds: number
  readonly paymentDelayMs: number
  readonly paymentDeclineRate: number
  readonly realtimeEnabled: boolean
  readonly envScenarios: string[]
  readonly seedReset: boolean
}

function invalid(name: string, expected: string, raw: string): never {
  throw new Error(`Variável ${name} inválida: ${expected}. Valor recebido: "${raw}".`)
}

function readNumber(name: string, raw: string, min: number, max?: number): number {
  const trimmed = raw.trim()
  const value = trimmed === '' ? Number.NaN : Number(trimmed)
  const inRange = max === undefined ? value >= min : value >= min && value <= max
  if (!Number.isFinite(value) || !inRange) {
    const expected =
      max === undefined
        ? `esperado número maior ou igual a ${min}`
        : `esperado número entre ${min} e ${max}`
    invalid(name, expected, raw)
  }
  return value
}

function readOption<T extends string>(name: string, raw: string, options: readonly T[]): T {
  const match = options.find((option) => option === raw)
  if (match === undefined) {
    invalid(name, `esperado um de: ${options.join(', ')}`, raw)
  }
  return match
}

function readScenarios(raw: string): string[] {
  return raw
    .split(',')
    .map((scenario) => scenario.trim())
    .filter((scenario) => scenario !== '')
}

function readMockConfig(): MockConfig {
  const minMs = readNumber(
    'VITE_MOCK_LATENCY_MIN_MS',
    import.meta.env.VITE_MOCK_LATENCY_MIN_MS ?? '',
    0,
  )
  const maxMs = readNumber(
    'VITE_MOCK_LATENCY_MAX_MS',
    import.meta.env.VITE_MOCK_LATENCY_MAX_MS ?? '',
    0,
  )
  if (minMs > maxMs) {
    invalid(
      'VITE_MOCK_LATENCY_MIN_MS',
      `não pode ser maior que VITE_MOCK_LATENCY_MAX_MS (${maxMs})`,
      String(minMs),
    )
  }

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
  if (apiBaseUrl === '') {
    invalid('VITE_API_BASE_URL', 'esperado um caminho ou URL não vazio', '')
  }

  return Object.freeze({
    mockingEnabled:
      readOption('VITE_API_MOCKING', import.meta.env.VITE_API_MOCKING ?? '', [
        'enabled',
        'disabled',
      ]) === 'enabled',
    apiBaseUrl,
    latency: Object.freeze({ minMs, maxMs }),
    errorRate: readNumber('VITE_MOCK_ERROR_RATE', import.meta.env.VITE_MOCK_ERROR_RATE ?? '', 0, 1),
    networkErrorRate: readNumber(
      'VITE_MOCK_NETWORK_ERROR_RATE',
      import.meta.env.VITE_MOCK_NETWORK_ERROR_RATE ?? '',
      0,
      1,
    ),
    sessionTtlSeconds: readNumber(
      'VITE_MOCK_SESSION_TTL_SECONDS',
      import.meta.env.VITE_MOCK_SESSION_TTL_SECONDS ?? '',
      0,
    ),
    quoteTtlSeconds: readNumber(
      'VITE_MOCK_QUOTE_TTL_SECONDS',
      import.meta.env.VITE_MOCK_QUOTE_TTL_SECONDS ?? '',
      0,
    ),
    paymentDelayMs: readNumber(
      'VITE_MOCK_PAYMENT_DELAY_MS',
      import.meta.env.VITE_MOCK_PAYMENT_DELAY_MS ?? '',
      0,
    ),
    paymentDeclineRate: readNumber(
      'VITE_MOCK_PAYMENT_DECLINE_RATE',
      import.meta.env.VITE_MOCK_PAYMENT_DECLINE_RATE ?? '',
      0,
      1,
    ),
    realtimeEnabled:
      readOption('VITE_MOCK_REALTIME', import.meta.env.VITE_MOCK_REALTIME ?? '', [
        'enabled',
        'disabled',
      ]) === 'enabled',
    envScenarios: readScenarios(import.meta.env.VITE_MOCK_SCENARIOS ?? ''),
    seedReset:
      readOption('VITE_MOCK_SEED_RESET', import.meta.env.VITE_MOCK_SEED_RESET ?? '', [
        'true',
        'false',
      ]) === 'true',
  })
}

export const mockConfig: MockConfig = readMockConfig()

export const isTestMode = import.meta.env.MODE === 'test'

export function apiPath(path: string): string {
  const base = mockConfig.apiBaseUrl.replace(/\/+$/, '')
  const relative = path.replace(/^\/+/, '')
  return `${base}/${relative}`
}
