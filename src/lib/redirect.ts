// Base fictícia só para interpretar caminhos relativos com a API de URL.
const BASE_ORIGIN = 'http://kurio.local'
const MAX_REDIRECT_LENGTH = 2048
// Caracteres de controle (U+0000 a U+001F e U+007F), checados por código para evitar regex com controle (no-control-regex).
function hasControlChar(value: string): boolean {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0
    if (code <= 0x1f || code === 0x7f) return true
  }
  return false
}

function isAuthPath(pathname: string): boolean {
  return ['/entrar', '/cadastro'].some(
    (authPath) => pathname === authPath || pathname.startsWith(`${authPath}/`),
  )
}

// Aceita só caminhos internos; qualquer outra coisa vira undefined.
export function parseRedirect(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  if (value.length > MAX_REDIRECT_LENGTH) return undefined
  if (!value.startsWith('/') || value.startsWith('//')) return undefined
  if (value.includes('\\') || hasControlChar(value)) return undefined

  let url: URL
  try {
    url = new URL(value, BASE_ORIGIN)
  } catch {
    return undefined
  }
  if (url.origin !== BASE_ORIGIN) return undefined
  if (isAuthPath(url.pathname)) return undefined

  return value
}

export type AuthSearch = { redirect: string | undefined }

// Sempre devolve a chave: o roteador mescla o retorno sobre a busca bruta, então uma chave ausente manteria o valor inválido.
export function validateAuthSearch(search: Record<string, unknown>): AuthSearch {
  return { redirect: parseRedirect(search.redirect) }
}

export function isProtectedPath(path: string): boolean {
  const url = new URL(path, BASE_ORIGIN)
  const { pathname, searchParams } = url

  if (pathname === '/pagamento') return true
  if (pathname.startsWith('/pedido/')) return true
  if (pathname === '/perfil' || pathname.startsWith('/perfil/')) return true
  return pathname === '/' && searchParams.get('favoritos') === '1'
}

// Para onde o modal de autenticação leva ao fechar.
export function closeTarget(redirect: string | undefined): string {
  if (redirect === undefined || isProtectedPath(redirect)) return '/'
  return redirect
}
