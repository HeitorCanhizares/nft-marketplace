import { delay } from 'msw'
import { hasScenario } from './active'
import { mockConfig } from './config'

function randomBetween(minMs: number, maxMs: number): number {
  return minMs + Math.random() * (maxMs - minMs)
}

// Sorteado a cada requisição: é isso que gera respostas fora de ordem.
export function pickLatencyMs(): number {
  if (hasScenario('slow')) return Math.round(randomBetween(2000, 5000))
  if (hasScenario('jitter')) return Math.round(randomBetween(0, 3000))
  return Math.round(randomBetween(mockConfig.latency.minMs, mockConfig.latency.maxMs))
}

export function wait(ms: number): Promise<void> {
  return delay(ms)
}
