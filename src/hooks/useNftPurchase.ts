import { useState, useEffect, useRef } from 'react'

import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { useCart } from '@/hooks/useCart'
import { quantityLimit } from '@/lib/maxQuantity'
import type { Edition, NftDetail } from '@/types/nft'

type Notice = { id: number; text: string }

export type NftPurchase = {
  edition: Edition
  editionId: string
  selectEdition: (id: string) => void
  quantity: number
  increment: () => void
  decrement: () => void
  inCart: number
  inCartText: string | undefined
  max: number
  hint: string | undefined
  canAdd: boolean
  allSoldOut: boolean
  notice: string | null
}

// Estado da compra no detalhe: edição escolhida, quantidade e ajustes quando o estoque muda.
export function useNftPurchase(nft: NftDetail): NftPurchase {
  const { announce } = useLiveAnnouncer()
  const { data: cartData } = useCart()

  const [selectedId, setSelectedId] = useState<string>(
    () => nft.defaultEditionId ?? nft.editions[0].id,
  )
  const [quantity, setQuantity] = useState(1)
  const [notice, setNotice] = useState<Notice | null>(null)

  const edition = nft.editions.find((item) => item.id === selectedId) ?? nft.editions[0]
  const inCart =
    cartData?.items
      .filter((item) => item.nft.id === nft.id && item.edition.id === edition.id)
      .reduce((total, item) => total + item.quantity, 0) ?? 0
  const { max, kind } = quantityLimit(edition, inCart)
  const allSoldOut = nft.soldOut === true

  // Ajustes por tempo real, no render: só comparam inteiros e trocam o state da própria tela.
  if (
    edition.available === 0 &&
    nft.defaultEditionId !== undefined &&
    nft.defaultEditionId !== edition.id
  ) {
    const fallback = nft.editions.find((item) => item.id === nft.defaultEditionId)
    if (fallback !== undefined) {
      setSelectedId(fallback.id)
      setQuantity(1)
      setNotice({
        id: (notice?.id ?? 0) + 1,
        text: `A edição ${edition.label} esgotou. Selecionamos a edição ${fallback.label}.`,
      })
    }
  } else if (max >= 1 && quantity > max) {
    setQuantity(max)
    setNotice({
      id: (notice?.id ?? 0) + 1,
      text: `Quantidade ajustada para ${max}: o estoque mudou.`,
    })
  }

  // Refs só são lidas e escritas dentro de efeitos.
  const announceRef = useRef(announce)
  useEffect(() => {
    announceRef.current = announce
  })

  useEffect(() => {
    if (notice !== null) announceRef.current(notice.text, 'polite')
  }, [notice])

  let hint: string | undefined
  if (quantity >= max) {
    if (max === 0 && inCart > 0) {
      hint = 'Você já tem todas as unidades disponíveis no carrinho'
    } else if (max > 0) {
      hint = kind === 'stock' ? `Máximo disponível: ${max}` : `Máximo por compra: ${max}`
    }
  }

  function selectEdition(id: string): void {
    setSelectedId(id)
    setQuantity(1)
  }

  function increment(): void {
    if (quantity < max) setQuantity(quantity + 1)
  }

  function decrement(): void {
    if (quantity > 1) setQuantity(quantity - 1)
  }

  return {
    edition,
    editionId: edition.id,
    selectEdition,
    quantity,
    increment,
    decrement,
    inCart,
    inCartText: inCart > 0 ? `${inCart} já no seu carrinho` : undefined,
    max,
    hint,
    canAdd: !allSoldOut && edition.available !== 0 && max >= 1,
    allSoldOut,
    notice: notice?.text ?? null,
  }
}
