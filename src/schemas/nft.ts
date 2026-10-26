import { z } from 'zod'
import type {
  CatalogFacets,
  Edition,
  HomeResponse,
  NftDetail,
  NftSummary,
  Paginated,
  Post,
  Promo,
  Review,
} from '@/types/nft'
import { ethAmountSchema, isoDateSchema, networkSchema, paginatedSchema } from '@/schemas/common'

const imageSchema = z.object({
  src: z.string(),
  alt: z.string(),
})

const nftSummaryShape = {
  id: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: imageSchema,
  price: ethAmountSchema,
  previousPrice: ethAmountSchema.optional(),
  rarity: z.literal('rare').optional(),
  collection: z.object({ id: z.string(), name: z.string() }),
  network: networkSchema,
  isFavorite: z.boolean().optional(),
  soldOut: z.boolean().optional(),
  defaultEditionId: z.string().optional(),
}

export const nftSummarySchema: z.ZodType<NftSummary> = z.object(nftSummaryShape)

export const editionSchema: z.ZodType<Edition> = z.object({
  id: z.string(),
  label: z.string(),
  supply: z.number().int().nullable(),
  available: z.number().int().nullable(),
  price: ethAmountSchema,
})

// NftDetail estende NftSummary: o detalhe valida todos os campos; o resumo ignora os extras (sem passthrough).
export const nftDetailSchema: z.ZodType<NftDetail> = z.object({
  ...nftSummaryShape,
  description: z.string(),
  images: z.array(imageSchema),
  editions: z.array(editionSchema),
  attributes: z.array(z.string()),
  rating: z.object({
    average: z.number(),
    count: z.number().int().min(0),
  }),
  details: z.object({
    body: z.string(),
    network: z.string(),
    contract: z.string(),
    royalties: z.string(),
  }),
})

export const catalogFacetsSchema: z.ZodType<CatalogFacets> = z.object({
  collections: z.array(
    z.object({ id: z.string(), name: z.string(), count: z.number().int().min(0) }),
  ),
  networks: z.array(z.object({ id: z.string(), name: z.string(), count: z.number().int().min(0) })),
  priceRange: z.object({ min: ethAmountSchema, max: ethAmountSchema }),
})

export const catalogResponseSchema: z.ZodType<Paginated<NftSummary> & { facets: CatalogFacets }> =
  z.intersection(paginatedSchema(nftSummarySchema), z.object({ facets: catalogFacetsSchema }))

export const reviewSchema: z.ZodType<Review> = z.object({
  id: z.string(),
  nftId: z.string(),
  author: z.string(),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  body: z.string(),
  createdAt: isoDateSchema,
})

export const reviewPageSchema: z.ZodType<Paginated<Review>> = paginatedSchema(reviewSchema)

export const promoSchema: z.ZodType<Promo> = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  ctaLabel: z.string(),
  image: imageSchema,
  query: z.object({
    tab: z.enum(['all', 'new', 'trending']).optional(),
    collection: z.string().optional(),
    network: networkSchema.optional(),
    sort: z.string().optional(),
  }),
})

// O date dos posts é texto de exibição (ex.: "12 de setembro"), igual ao contrato: string.
export const postSchema: z.ZodType<Post> = z.object({
  id: z.string(),
  date: z.string(),
  readingMinutes: z.number().int(),
  title: z.string(),
  summary: z.string(),
  image: imageSchema,
})

export const homeResponseSchema: z.ZodType<HomeResponse> = z.object({
  hero: z.array(nftSummarySchema),
  featured: nftSummarySchema,
  promos: z.array(promoSchema),
  posts: z.array(postSchema),
})
