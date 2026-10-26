const HEX_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/

export function isHexAddress(value: string): boolean {
  return HEX_ADDRESS_PATTERN.test(value)
}

// 0xA91F…E82C: 4 caracteres depois do 0x, reticências e 4 finais.
export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
