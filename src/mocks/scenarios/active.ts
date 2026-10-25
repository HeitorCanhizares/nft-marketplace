import { STORAGE_KEYS, storage } from '../../lib/storage'
import { mockConfig } from './config'

export const FIXED_SCENARIO_NAMES = [
  'empty-catalog',
  'empty-cart',
  'empty-wallets',
  'slow',
  'jitter',
  'offline',
  'session-expired',
  'forbidden-order',
  'email-taken',
  'username-taken',
  'price-change-on-checkout',
  'sold-out-on-checkout',
  'coupon-expires-on-checkout',
  'fee-change-on-checkout',
  'order-timeout',
  'payment-slow',
  'realtime-drop',
  'payment-confirmed',
  'payment-declined',
  'session-expired-on-checkout',
  'wallet-rejected',
  'wallet-disconnect',
  'wallet-wrong-network',
  'wallet-sign-rejected',
] as const

export const PARAMETRIZED_SCENARIO_KINDS = [
  'network-error',
  'server-error',
  'unavailable',
  'not-found',
  'validation-error',
] as const

export type ParametrizedScenarioKind = (typeof PARAMETRIZED_SCENARIO_KINDS)[number]

// `<rota>` no formato `MÉTODO /caminho`, ex.: `server-error:GET /nfts`.
export type ScenarioName =
  (typeof FIXED_SCENARIO_NAMES)[number] | `${ParametrizedScenarioKind}:${string}`

const fixedNames = new Set<string>(FIXED_SCENARIO_NAMES)
const parametrizedKinds = new Set<string>(PARAMETRIZED_SCENARIO_KINDS)
const warnedUnknownNames = new Set<string>()

function parseScenarioList(raw: string): string[] {
  return raw
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name !== '')
}

function isKnownScenario(name: string): boolean {
  if (fixedNames.has(name)) return true
  const separator = name.indexOf(':')
  if (separator <= 0) return false
  const kind = name.slice(0, separator)
  const routeKey = name.slice(separator + 1).trim()
  return parametrizedKinds.has(kind) && routeKey !== ''
}

function readOverride(): string[] | null {
  // Em produção o localStorage não altera o comportamento do mock (decisão A6).
  if (import.meta.env.MODE === 'production') return null
  const raw = storage.local.get(STORAGE_KEYS.mockScenarios)
  return raw === null ? null : parseScenarioList(raw)
}

/** Lê o localStorage a cada chamada: os testes trocam o valor sem recarregar o módulo. */
export function getActiveScenarios(): string[] {
  // Valor presente no localStorage (mesmo vazio) substitui o do ambiente.
  const scenarios = readOverride() ?? mockConfig.envScenarios
  for (const name of scenarios) {
    if (!isKnownScenario(name) && !warnedUnknownNames.has(name)) {
      warnedUnknownNames.add(name)
      console.warn(`Cenário de mock desconhecido: "${name}".`)
    }
  }
  return [...scenarios]
}

export function hasScenario(name: ScenarioName): boolean {
  return getActiveScenarios().includes(name)
}

export function routeScenario(kind: ParametrizedScenarioKind, routeKey: string): boolean {
  return hasScenario(`${kind}:${routeKey}`)
}
