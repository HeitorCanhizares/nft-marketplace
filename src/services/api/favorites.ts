import { del, put } from '@/services/http/validate'

export function addFavorite(nftId: string): Promise<void> {
  return put('/favorites/' + encodeURIComponent(nftId), null)
}

export function removeFavorite(nftId: string): Promise<void> {
  return del('/favorites/' + encodeURIComponent(nftId), null)
}
