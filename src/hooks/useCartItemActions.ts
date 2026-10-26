import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { cart, quoteAll } from '@/hooks/queryKeys'
import { addCartItem, removeCartItem, updateCartItem } from '@/services/api/cart'
import { isApiError } from '@/services/http/ApiError'
import type { Cart, CartItem } from '@/types/cart'

// Raiz de todas as cotações (a chave quote(input) é uma função, não serve para invalidar).
const QUANTITY_KEY = ['cart-quantity'] as const
const REMOVE_KEY = ['cart-remove'] as const

// Cliques de quantidade dentro desta janela viram um único PATCH com o valor final.
const GROUP_DELAY_MS = 400
const UNDO_DURATION_MS = 6000

type QuantityVars = { itemId: string; name: string; baseline: number; quantity: number }
type RemoveVars = { line: CartItem; index: number }

// Cliques pendentes de uma linha. `baseline` é a quantidade antes do primeiro clique do grupo.
// timer null com o grupo ainda guardado = valor final pronto, esperando o PATCH anterior.
type QuantityGroup = {
  name: string
  baseline: number
  target: number
  timer: ReturnType<typeof setTimeout> | null
}

function isQuantityVars(value: unknown): value is QuantityVars {
  return typeof value === 'object' && value !== null && 'itemId' in value && 'quantity' in value
}

function isRemoveVars(value: unknown): value is RemoveVars {
  return typeof value === 'object' && value !== null && 'line' in value && 'index' in value
}

function sumQuantities(items: readonly CartItem[]): number {
  return items.reduce((total, line) => total + line.quantity, 0)
}

// Só a quantidade muda no cache: o valor da linha e o total ficam como estavam até a resposta.
function withQuantity(cartData: Cart, itemId: string, quantity: number): Cart {
  const items = cartData.items.map((line) => (line.id === itemId ? { ...line, quantity } : line))
  return { ...cartData, items, itemCount: sumQuantities(items) }
}

function withoutLine(cartData: Cart, itemId: string): Cart {
  const items = cartData.items.filter((line) => line.id !== itemId)
  return { ...cartData, items, itemCount: sumQuantities(items) }
}

function withLine(cartData: Cart, line: CartItem, index: number): Cart {
  const items = [...cartData.items]
  items.splice(Math.min(index, items.length), 0, line)
  return { ...cartData, items, itemCount: sumQuantities(items) }
}

function numberDetail(details: Record<string, unknown> | undefined, key: string): number {
  const value = details?.[key]
  return typeof value === 'number' ? value : 0
}

// Ações sobre as linhas do carrinho: quantidade (agrupada), remover com "Desfazer" e ajustar ao estoque.
export function useCartItemActions() {
  const queryClient = useQueryClient()
  const { announce } = useLiveAnnouncer()
  // Lido e escrito só em callbacks e temporizadores, nunca durante o render.
  const groups = useRef(new Map<string, QuantityGroup>())
  // Linhas com requisição ativa: só para a UI. A trava de clique repetido usa isMutating.
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set())

  const quantityMutation = useMutation({
    mutationKey: QUANTITY_KEY,
    mutationFn: ({ itemId, quantity }: QuantityVars) => updateCartItem(itemId, quantity),
    onSuccess: (data) => {
      // Com outra linha ainda pendente, a resposta deixaria o valor otimista antigo na tela: fica para o próximo PATCH.
      if (groups.current.size === 0) queryClient.setQueryData(cart, data)
      void queryClient.invalidateQueries({ queryKey: quoteAll })
    },
    onError: (error, vars) => {
      if (!groups.current.has(vars.itemId)) revertQuantity(vars.itemId, vars.baseline)

      if (isApiError(error) && error.code === 'QUANTITY_EXCEEDS_STOCK') {
        toast.error(`Só há ${numberDetail(error.details, 'available')} unidades disponíveis.`)
      } else if (isApiError(error) && error.code === 'SOLD_OUT') {
        toast.error(`${vars.name} esgotou.`)
      } else {
        toast.error('Não foi possível alterar a quantidade. Tente de novo.')
      }
      void queryClient.invalidateQueries({ queryKey: cart })
    },
    onSettled: (_data, _error, vars) => {
      markPending(vars.itemId, false)
      drainQuantity(vars.itemId)
    },
  })

  const removeMutation = useMutation({
    mutationKey: REMOVE_KEY,
    mutationFn: ({ line }: RemoveVars) => removeCartItem(line.id),
    onSuccess: (data, { line }) => {
      if (groups.current.size === 0) queryClient.setQueryData(cart, data)
      void queryClient.invalidateQueries({ queryKey: quoteAll })
      toast(`${line.nft.name} removido`, {
        duration: UNDO_DURATION_MS,
        action: { label: 'Desfazer', onClick: () => void undoRemove(line) },
      })
      announce(`${line.nft.name} removido do carrinho`, 'polite')
    },
    onError: (_error, { line, index }) => {
      const current = queryClient.getQueryData<Cart>(cart)
      if (current !== undefined && index !== -1) {
        queryClient.setQueryData(cart, withLine(current, line, index))
      }
      toast.error(`Não foi possível remover ${line.nft.name}. Tente de novo.`)
      void queryClient.invalidateQueries({ queryKey: cart })
    },
  })

  function markPending(itemId: string, pending: boolean): void {
    setPendingIds((prev) => {
      const next = new Set(prev)
      if (pending) next.add(itemId)
      else next.delete(itemId)
      return next
    })
  }

  // Consulta síncrona: o cache de mutações já sabe se há um PATCH desta linha em andamento.
  function isQuantityInFlight(itemId: string): boolean {
    return (
      queryClient.isMutating({
        mutationKey: QUANTITY_KEY,
        predicate: (candidate) => {
          const vars = candidate.state.variables
          return isQuantityVars(vars) && vars.itemId === itemId
        },
      }) > 0
    )
  }

  function sendQuantity(itemId: string, group: QuantityGroup): void {
    markPending(itemId, true)
    quantityMutation.mutate({
      itemId,
      name: group.name,
      baseline: group.baseline,
      quantity: group.target,
    })
  }

  function revertQuantity(itemId: string, quantity: number): void {
    const current = queryClient.getQueryData<Cart>(cart)
    if (current !== undefined) {
      queryClient.setQueryData(cart, withQuantity(current, itemId, quantity))
    }
  }

  // Temporizador venceu: envia o valor final, ou deixa esperando se um PATCH da linha ainda não terminou.
  function flushQuantity(itemId: string): void {
    const group = groups.current.get(itemId)
    if (group === undefined) return
    group.timer = null
    if (isQuantityInFlight(itemId)) return

    groups.current.delete(itemId)
    sendQuantity(itemId, group)
  }

  // PATCH anterior terminou: se o valor final estava esperando, envia agora.
  function drainQuantity(itemId: string): void {
    const group = groups.current.get(itemId)
    if (group === undefined || group.timer !== null) return

    groups.current.delete(itemId)
    sendQuantity(itemId, group)
  }

  function applyQuantity(item: CartItem, quantity: number, immediate: boolean): void {
    const current = queryClient.getQueryData<Cart>(cart)
    const line = current?.items.find((candidate) => candidate.id === item.id)
    if (current === undefined || line === undefined || quantity === line.quantity) return

    queryClient.setQueryData(cart, withQuantity(current, item.id, quantity))

    const existing = groups.current.get(item.id)
    const group: QuantityGroup = existing ?? {
      name: item.nft.name,
      baseline: line.quantity,
      target: quantity,
      timer: null,
    }
    group.target = quantity
    if (group.timer !== null) clearTimeout(group.timer)
    group.timer = null
    groups.current.set(item.id, group)

    if (immediate) {
      flushQuantity(item.id)
    } else {
      group.timer = setTimeout(() => flushQuantity(item.id), GROUP_DELAY_MS)
    }
  }

  // Desfazer: devolve a linha com a mesma edição e quantidade; se o estoque não cabe, repete com o que sobrou.
  async function undoRemove(line: CartItem): Promise<void> {
    const name = line.nft.name
    const request = (quantity: number) =>
      addCartItem({ nftId: line.nft.id, editionId: line.edition.id, quantity })

    const restore = (restored: Cart) => {
      queryClient.setQueryData(cart, restored)
      void queryClient.invalidateQueries({ queryKey: quoteAll })
      announce(`${name} voltou ao carrinho`, 'polite')
    }

    try {
      restore(await request(line.quantity))
    } catch (error) {
      if (!isApiError(error) || error.code !== 'QUANTITY_EXCEEDS_STOCK') {
        toast.error(`Não foi possível desfazer a remoção de ${name}. Tente de novo.`)
        return
      }

      const addable =
        numberDetail(error.details, 'available') - numberDetail(error.details, 'inCart')
      if (addable < 1) {
        toast.error(`Não há mais estoque de ${name}.`)
        return
      }

      try {
        restore(await request(addable))
        toast(`Só havia ${addable} unidades disponíveis; adicionamos ${addable}.`)
      } catch {
        toast.error(`Não foi possível desfazer a remoção de ${name}. Tente de novo.`)
      }
    }
  }

  function setQuantity(item: CartItem, quantity: number): void {
    applyQuantity(item, quantity, false)
  }

  function remove(item: CartItem): void {
    const inFlight = queryClient.isMutating({
      mutationKey: REMOVE_KEY,
      predicate: (candidate) => {
        const vars = candidate.state.variables
        return isRemoveVars(vars) && vars.line.id === item.id
      },
    })
    if (inFlight > 0) return

    // Um PATCH pendente para a linha não pode mais sair depois que ela foi removida.
    const pending = groups.current.get(item.id)
    if (pending !== undefined && pending.timer !== null) clearTimeout(pending.timer)
    groups.current.delete(item.id)

    const current = queryClient.getQueryData<Cart>(cart)
    const index = current?.items.findIndex((line) => line.id === item.id) ?? -1
    const line = current !== undefined && index !== -1 ? current.items[index] : item
    if (current !== undefined && index !== -1) {
      queryClient.setQueryData(cart, withoutLine(current, item.id))
    }

    removeMutation.mutate({ line, index })
  }

  // Ajustar para N: envio imediato, sem agrupar.
  function adjust(item: CartItem): void {
    if (item.available === null || item.available < 1) return
    applyQuantity(item, item.available, true)
    announce(`Quantidade de ${item.nft.name} ajustada para ${item.available}`, 'polite')
  }

  return { setQuantity, remove, adjust, pendingIds }
}
