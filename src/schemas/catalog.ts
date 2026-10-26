import { z } from 'zod'
import type { CatalogSort, CatalogTab, HomeSearch } from '@/types/catalog'
import { networkSchema } from '@/schemas/common'

// Texto vindo do roteador pode chegar como string ou número (ex.: ?q=123).
const textInput = z.union([z.string(), z.number()]).transform((value) => String(value))

// Número vindo do roteador pode chegar como número ou string (ex.: ?pagina=2).
const numberInput = z.union([z.number(), z.string()]).transform((value) => {
  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value)
  }
  return value
})

const qSchema = textInput
  .transform((value) => value.trim())
  .pipe(z.string().max(100))
  .transform((value) => (value === '' ? undefined : value))
  .catch(undefined)

const abaSchema = z
  .enum(['todos', 'novos', 'em-alta'])
  .transform((value): CatalogTab | undefined => (value === 'todos' ? undefined : value))
  .catch(undefined)

const ordemSchema = z
  .enum(['recentes', 'menor-preco', 'maior-preco', 'mais-avaliados', 'mais-favoritados'])
  .transform((value): CatalogSort | undefined => (value === 'recentes' ? undefined : value))
  .catch(undefined)

const colecaoSchema = textInput.pipe(z.string().min(1).max(60)).optional().catch(undefined)

const redeSchema = networkSchema.optional().catch(undefined)

const precoSchema = numberInput
  .pipe(z.number().finite().min(0))
  .transform((value) => Math.round(value * 100) / 100)
  .optional()
  .catch(undefined)

const paginaSchema = numberInput
  .pipe(z.number().int().min(1).max(1000))
  .transform((value) => (value === 1 ? undefined : value))
  .catch(undefined)

const favoritosSchema = z
  .union([z.literal(1), z.literal('1')])
  .transform((): 1 => 1)
  .optional()
  .catch(undefined)

// Devolve sempre as 9 chaves: valor válido ou `undefined` (o roteador mescla sobre a busca bruta).
export function validateHomeSearch(search: Record<string, unknown>): HomeSearch {
  const precoMin = precoSchema.parse(search.precoMin)
  const precoMax = precoSchema.parse(search.precoMax)
  const invertido = precoMin !== undefined && precoMax !== undefined && precoMin > precoMax

  return {
    q: qSchema.parse(search.q),
    aba: abaSchema.parse(search.aba),
    colecao: colecaoSchema.parse(search.colecao),
    rede: redeSchema.parse(search.rede),
    precoMin: invertido ? undefined : precoMin,
    precoMax: invertido ? undefined : precoMax,
    ordem: ordemSchema.parse(search.ordem),
    pagina: paginaSchema.parse(search.pagina),
    favoritos: favoritosSchema.parse(search.favoritos),
  }
}

// Filtros que contam para o indicador de filtros ativos (não conta aba, ordem, página nem favoritos).
export function hasActiveFilters(search: HomeSearch): boolean {
  return (
    search.q !== undefined ||
    search.colecao !== undefined ||
    search.rede !== undefined ||
    search.precoMin !== undefined ||
    search.precoMax !== undefined
  )
}
