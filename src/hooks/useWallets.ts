import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { toast } from 'sonner'

import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { wallets } from '@/hooks/queryKeys'
import type { WalletBody } from '@/schemas/wallet'
import {
  getWallets,
  removeSecondaryWallet,
  savePrimaryWallet,
  saveSecondaryWallet,
  swapWallets,
} from '@/services/api/wallets'
import type { Wallet, WalletsResponse } from '@/types/user'

const SAVE_PRIMARY_KEY = ['save-primary-wallet'] as const
const SAVE_SECONDARY_KEY = ['save-secondary-wallet'] as const
const REMOVE_SECONDARY_KEY = ['remove-secondary-wallet'] as const
const SWAP_KEY = ['swap-wallets'] as const

export function useWallets() {
  return useQuery({
    queryKey: wallets,
    queryFn: ({ signal }) => getWallets(signal),
  })
}

export function useWalletMutations() {
  const queryClient = useQueryClient()
  const { announce } = useLiveAnnouncer()

  // Promessas em andamento, guardadas fora do render.
  const primaryInFlight = useRef<Promise<Wallet> | null>(null)
  const secondaryInFlight = useRef<Promise<Wallet> | null>(null)
  const removeInFlight = useRef<Promise<void> | null>(null)
  const swapInFlight = useRef<Promise<WalletsResponse> | null>(null)

  // Trava de clique repetido: enquanto houver envio com a mesma chave, devolve a mesma promessa.
  function locked<T>(
    inFlight: { current: Promise<T> | null },
    mutationKey: readonly unknown[],
    start: () => Promise<T>,
  ): Promise<T> {
    if (inFlight.current && queryClient.isMutating({ mutationKey }) > 0) {
      return inFlight.current
    }
    const promise = start()
    inFlight.current = promise
    return promise
  }

  function applyWallets(next: WalletsResponse) {
    queryClient.setQueryData<WalletsResponse>(wallets, next)
    void queryClient.invalidateQueries({ queryKey: wallets })
  }

  function currentWallets(): WalletsResponse {
    return queryClient.getQueryData<WalletsResponse>(wallets) ?? { primary: null, secondary: null }
  }

  function notify(message: string) {
    toast.success(message)
    announce(message, 'polite')
  }

  const savePrimaryMutation = useMutation({
    mutationKey: SAVE_PRIMARY_KEY,
    mutationFn: (body: WalletBody) => savePrimaryWallet(body),
    onSuccess: (primary) => {
      applyWallets({ primary, secondary: currentWallets().secondary })
      notify('Carteira principal salva')
    },
  })

  const saveSecondaryMutation = useMutation({
    mutationKey: SAVE_SECONDARY_KEY,
    mutationFn: (body: WalletBody) => saveSecondaryWallet(body),
    onSuccess: (secondary) => {
      applyWallets({ primary: currentWallets().primary, secondary })
      notify('Carteira secundária salva')
    },
  })

  const removeSecondaryMutation = useMutation({
    mutationKey: REMOVE_SECONDARY_KEY,
    mutationFn: () => removeSecondaryWallet(),
    onSuccess: () => {
      applyWallets({ primary: currentWallets().primary, secondary: null })
      notify('Carteira secundária removida')
    },
  })

  const swapMutation = useMutation({
    mutationKey: SWAP_KEY,
    mutationFn: () => swapWallets(),
    onSuccess: (pair) => {
      applyWallets(pair)
      notify('Carteiras trocadas')
    },
  })

  return {
    // Quem chama trata o erro; o hook só repassa a rejeição.
    savePrimary: (body: WalletBody) =>
      locked(primaryInFlight, SAVE_PRIMARY_KEY, () => savePrimaryMutation.mutateAsync(body)),
    saveSecondary: (body: WalletBody) =>
      locked(secondaryInFlight, SAVE_SECONDARY_KEY, () => saveSecondaryMutation.mutateAsync(body)),
    removeSecondary: () =>
      locked(removeInFlight, REMOVE_SECONDARY_KEY, () => removeSecondaryMutation.mutateAsync()),
    swap: () => locked(swapInFlight, SWAP_KEY, () => swapMutation.mutateAsync()),
    isPending:
      savePrimaryMutation.isPending ||
      saveSecondaryMutation.isPending ||
      removeSecondaryMutation.isPending ||
      swapMutation.isPending,
  }
}
