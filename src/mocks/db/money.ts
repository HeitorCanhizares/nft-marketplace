// O front nunca usa este arquivo; só o mock.

export const ETH_DECIMALS = 6

const UNITS_PER_ETH = 10 ** ETH_DECIMALS
const ETH_PATTERN = /^\d+(\.\d+)?$/

// Lê uma string decimal sem sinal e devolve unidades de 0,000001 ETH (decimais além de 6 são truncadas).
export function ethToUnits(eth: string): number {
  if (!ETH_PATTERN.test(eth)) {
    throw new Error(`Valor em ETH inválido: "${eth}".`)
  }

  const [integerPart, fractionPart = ''] = eth.split('.')
  const fraction = fractionPart.slice(0, ETH_DECIMALS).padEnd(ETH_DECIMALS, '0')
  const units = Number(integerPart) * UNITS_PER_ETH + Number(fraction)

  if (!Number.isSafeInteger(units)) {
    throw new Error(`Valor em ETH fora do limite: "${eth}".`)
  }
  return units
}

// Converte unidades inteiras em string decimal com pelo menos 2 casas.
export function unitsToEth(units: number): string {
  if (!Number.isSafeInteger(units) || units < 0) {
    throw new Error(`Unidades de ETH inválidas: ${units}.`)
  }

  const integerPart = Math.floor(units / UNITS_PER_ETH)
  const fraction = String(units % UNITS_PER_ETH).padStart(ETH_DECIMALS, '0')
  const trimmed = fraction.replace(/0+$/, '').padEnd(2, '0')

  return `${integerPart}.${trimmed}`
}

export function multiplyEth(unitPrice: string, quantity: number): string {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new Error(`Quantidade inválida: ${quantity}.`)
  }
  return unitsToEth(ethToUnits(unitPrice) * quantity)
}
