export const PBKDF2_ITERATIONS = 100_000

const SALT_BYTES = 16
const KEY_BITS = 256

export type PasswordHash = {
  salt: string
  hash: string
  iterations: number
}

export type PasswordRecord = {
  salt: string
  hash: string
  iterations?: number
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    KEY_BITS,
  )
  return new Uint8Array(bits)
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false
  }
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i]
  }
  return diff === 0
}

export async function hashPassword(password: string, salt?: string): Promise<PasswordHash> {
  const saltBytes =
    salt === undefined
      ? crypto.getRandomValues(new Uint8Array(new ArrayBuffer(SALT_BYTES)))
      : fromBase64(salt)
  const derived = await deriveKey(password, saltBytes, PBKDF2_ITERATIONS)
  return {
    salt: toBase64(saltBytes),
    hash: toBase64(derived),
    iterations: PBKDF2_ITERATIONS,
  }
}

export async function verifyPassword(password: string, record: PasswordRecord): Promise<boolean> {
  const iterations = record.iterations ?? PBKDF2_ITERATIONS
  const derived = await deriveKey(password, fromBase64(record.salt), iterations)
  return constantTimeEqual(derived, fromBase64(record.hash))
}
