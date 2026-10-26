// Só troca o separador e acrescenta "ETH". Nunca converte para number.
const ETH_PATTERN = /^\d+(\.\d+)?$/

export function formatEth(value: string, separator: '.' | ',' = '.'): string {
  if (!ETH_PATTERN.test(value)) {
    return `${value} ETH`
  }
  return `${value.replace('.', separator)} ETH`
}

// Versão para leitura (aria-label e anúncios): vírgula decimal.
export function formatEthSpoken(value: string): string {
  return formatEth(value, ',')
}
