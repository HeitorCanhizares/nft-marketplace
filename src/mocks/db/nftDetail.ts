import type { NftDetail } from '@/types/nft'
import type { NftRecord } from './db'
import { toNftSummary } from './nftSummary'

// Monta o NftDetail da API campo a campo (sem createdAt nem stats), a partir de toNftSummary.
export function toNftDetail(record: NftRecord, favoriteIds?: ReadonlySet<string>): NftDetail {
  return {
    ...toNftSummary(record, favoriteIds),
    description: record.description,
    images: record.images.map((image) => ({ src: image.src, alt: image.alt })),
    editions: record.editions.map((edition) => ({ ...edition })),
    attributes: [...record.attributes],
    rating: { average: record.rating.average, count: record.rating.count },
    details: { ...record.details },
  }
}
