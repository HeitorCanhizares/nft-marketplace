import type { Network } from '@/types/nft'

type Explorer = { name: string; base: string }

// Tabela única: nome exibido e prefixo da URL de transação de cada rede.
const EXPLORERS: Record<Network, Explorer> = {
  ethereum: { name: 'Etherscan', base: 'https://etherscan.io/tx/' },
  polygon: { name: 'Polygonscan', base: 'https://polygonscan.com/tx/' },
  solana: { name: 'Solscan', base: 'https://solscan.io/tx/' },
}

const TRUSTED_HOSTS: ReadonlySet<string> = new Set([
  'etherscan.io',
  'polygonscan.com',
  'solscan.io',
])

export function explorerName(network: Network): string {
  return EXPLORERS[network].name
}

export function buildExplorerUrl(network: Network, txHash: string): string {
  return EXPLORERS[network].base + txHash
}

// Só https em domínio de explorador conhecido: o explorerUrl vindo da API não é confiável por si.
export function isExplorerUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && TRUSTED_HOSTS.has(parsed.hostname)
  } catch {
    return false
  }
}
