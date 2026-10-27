import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { shortAddress } from '@/lib/address'
import { cn } from '@/lib/utils'
import { networkLabel, providerLabel } from '@/lib/walletOptions'
import type { Network, WalletProvider } from '@/types/nft'
import type { WalletConnectionStatus as ConnectionStatus } from '@/types/wallet'

type WalletConnectionStatusProps = {
  status: ConnectionStatus
  provider: WalletProvider | null
  address: string | null
  network: Network | null
  expectedNetwork: Network | null
  errorCode?: string | null
  hint?: string | null
  onReconnect: () => void
  onSwitchNetwork: () => void
  onDisconnect: () => void
}

type StatusView = {
  icon: ReactNode
  text: string
  tone: string
  action: { label: string; onClick: () => void } | null
}

// Estado da conexão com ícone e texto (nunca só cor). Não é aria-live: o hook já anuncia cada estado.
export function WalletConnectionStatus({
  status,
  provider,
  address,
  network,
  expectedNetwork,
  errorCode = null,
  hint = null,
  onReconnect,
  onSwitchNetwork,
  onDisconnect,
}: WalletConnectionStatusProps) {
  const view = describeStatus({
    status,
    provider,
    address,
    network,
    expectedNetwork,
    errorCode,
    onReconnect,
    onSwitchNetwork,
    onDisconnect,
  })

  return (
    <div className="flex flex-col gap-2" aria-busy={status === 'connecting'}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span className={cn('flex items-center gap-2', view.tone)}>
          {view.icon}
          <span>{view.text}</span>
        </span>
        {view.action ? (
          <Button variant="outline" className="min-h-11" onClick={view.action.onClick}>
            {view.action.label}
          </Button>
        ) : null}
      </div>
      {hint ? <p className="text-caption-md text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

type DescribeInput = {
  status: ConnectionStatus
  provider: WalletProvider | null
  address: string | null
  network: Network | null
  expectedNetwork: Network | null
  errorCode: string | null
  onReconnect: () => void
  onSwitchNetwork: () => void
  onDisconnect: () => void
}

function describeStatus(input: DescribeInput): StatusView {
  const { status, provider, address, network, expectedNetwork, errorCode } = input

  if (status === 'connecting') {
    return {
      icon: <LoaderCircleIcon aria-hidden="true" className="size-4 shrink-0 animate-spin" />,
      text: `Conectando à ${provider ? providerLabel(provider) : 'carteira'}...`,
      tone: 'text-muted-foreground',
      action: null,
    }
  }

  if (status === 'connected' && expectedNetwork !== null && network !== expectedNetwork) {
    const currentName = network ? networkLabel(network) : 'outra rede'
    return {
      icon: <TriangleAlertIcon aria-hidden="true" className="size-4 shrink-0 text-destructive" />,
      text: `Rede diferente: sua carteira está na ${currentName}. Selecione a ${networkLabel(expectedNetwork)}.`,
      tone: 'text-destructive',
      action: {
        label: `Trocar para ${networkLabel(expectedNetwork)}`,
        onClick: input.onSwitchNetwork,
      },
    }
  }

  if (status === 'connected') {
    return {
      icon: <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0 text-success" />,
      text: address ? `Conectada: ${shortAddress(address)}` : 'Conectada',
      tone: 'text-foreground',
      action: { label: 'Desconectar', onClick: input.onDisconnect },
    }
  }

  if (status === 'rejected') {
    return {
      icon: <CircleAlertIcon aria-hidden="true" className="size-4 shrink-0 text-destructive" />,
      text: errorCode === 'UNAVAILABLE' ? 'Carteira indisponível' : 'Conexão recusada na carteira',
      tone: 'text-destructive',
      action: { label: 'Tentar novamente', onClick: input.onReconnect },
    }
  }

  return {
    icon: <CircleDashedIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />,
    text: 'Não conectada',
    tone: 'text-muted-foreground',
    action: provider ? { label: 'Conectar', onClick: input.onReconnect } : null,
  }
}
