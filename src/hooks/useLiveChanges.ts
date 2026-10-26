import { useEffect, useRef, useState } from 'react'

import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import type { NftSummary } from '@/types/nft'

const UPDATED_MS = 5000
const ANNOUNCE_WINDOW_MS = 1000
const ANNOUNCE_COOLDOWN_MS = 5000

type Snap = { price: string; soldOut: boolean }
type Base = { items: readonly NftSummary[]; key: string; snap: ReadonlyMap<string, Snap> }
type Change = { seq: number; prices: string[]; soldOut: string[] }
type Counts = { prices: number; soldOut: number }

export type LiveChanges = { updatedIds: ReadonlySet<string> }

function takeSnapshot(items: readonly NftSummary[]): ReadonlyMap<string, Snap> {
  return new Map(
    items.map((item): [string, Snap] => [
      item.id,
      { price: item.price, soldOut: item.soldOut === true },
    ]),
  )
}

function buildMessage({ prices, soldOut }: Counts): string {
  const parts: string[] = []
  if (prices > 0) {
    parts.push(prices === 1 ? '1 preço foi atualizado' : `${prices} preços foram atualizados`)
  }
  if (soldOut > 0) {
    parts.push(soldOut === 1 ? '1 NFT esgotou' : `${soldOut} NFTs esgotaram`)
  }
  return parts.join(' e ')
}

// Detecta preço alterado e esgotamento entre duas listas da mesma consulta e marca os ids por 5 s.
// Trocar a chave (filtro, página, ordem) só troca a base: não marca nem anuncia nada.
export function useLiveChanges(
  items: readonly NftSummary[] | undefined,
  resetKey: string,
): LiveChanges {
  const { announce } = useLiveAnnouncer()

  const [base, setBase] = useState<Base | null>(null)
  const [updatedIds, setUpdatedIds] = useState<ReadonlySet<string>>(() => new Set())
  const [change, setChange] = useState<Change | null>(null)

  // Ajustar state durante o render: a condição `items !== base.items` impede laço.
  if (items && items !== base?.items) {
    if (base === null || base.key !== resetKey) {
      setBase({ items, key: resetKey, snap: takeSnapshot(items) })
      setUpdatedIds(new Set())
    } else {
      const prices: string[] = []
      const soldOut: string[] = []

      for (const item of items) {
        const previous = base.snap.get(item.id)
        if (!previous) continue
        if (previous.price !== item.price) prices.push(item.id)
        if (!previous.soldOut && item.soldOut === true) soldOut.push(item.id)
      }

      setBase({ items, key: resetKey, snap: takeSnapshot(items) })

      if (prices.length > 0 || soldOut.length > 0) {
        const ids = [...prices, ...soldOut]
        setUpdatedIds((prev) => new Set([...prev, ...ids]))
        setChange({ seq: (change?.seq ?? 0) + 1, prices, soldOut })
      }
    }
  }

  // Refs só são lidas e escritas dentro de efeitos e callbacks de timer.
  const expiryTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const accumulated = useRef<Counts>({ prices: 0, soldOut: 0 })
  const announceRef = useRef(announce)

  useEffect(() => {
    announceRef.current = announce
  })

  useEffect(() => {
    if (!change) return

    const expiry = expiryTimers.current
    for (const id of [...change.prices, ...change.soldOut]) {
      const existing = expiry.get(id)
      if (existing !== undefined) clearTimeout(existing)

      expiry.set(
        id,
        setTimeout(() => {
          expiry.delete(id)
          setUpdatedIds((prev) => {
            if (!prev.has(id)) return prev
            const next = new Set(prev)
            next.delete(id)
            return next
          })
        }, UPDATED_MS),
      )
    }

    // Anúncio agrupado: uma janela de 1 s; depois, 5 s sem novo aviso.
    function flush(): void {
      const counts = accumulated.current
      accumulated.current = { prices: 0, soldOut: 0 }
      if (counts.prices + counts.soldOut === 0) {
        announceTimer.current = null
        return
      }
      announceRef.current(buildMessage(counts), 'polite')
      announceTimer.current = setTimeout(afterCooldown, ANNOUNCE_COOLDOWN_MS)
    }

    function afterCooldown(): void {
      announceTimer.current = null
      flush()
    }

    accumulated.current = {
      prices: accumulated.current.prices + change.prices.length,
      soldOut: accumulated.current.soldOut + change.soldOut.length,
    }

    if (announceTimer.current === null) {
      announceTimer.current = setTimeout(flush, ANNOUNCE_WINDOW_MS)
    }
  }, [change])

  useEffect(() => {
    const expiry = expiryTimers.current

    return () => {
      for (const timer of expiry.values()) clearTimeout(timer)
      expiry.clear()
    }
  }, [])

  useEffect(() => {
    return () => {
      if (announceTimer.current !== null) clearTimeout(announceTimer.current)
      announceTimer.current = null
    }
  }, [])

  return { updatedIds }
}
