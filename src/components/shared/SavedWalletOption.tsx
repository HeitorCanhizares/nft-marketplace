import { useId } from 'react'
import { EllipsisVerticalIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RadioGroupItem } from '@/components/ui/radio-group'
import { shortAddress } from '@/lib/address'
import { networkLabel } from '@/lib/walletOptions'
import type { Wallet } from '@/types/user'

export type SavedWalletOptionProps = {
  value: 'primary' | 'secondary'
  wallet: Wallet
  onEdit: () => void
  disabled?: boolean
}

// Cartão de rádio com carteira salva (mobile). Precisa estar dentro de um RadioGroup.
export function SavedWalletOption({
  value,
  wallet,
  onEdit,
  disabled = false,
}: SavedWalletOptionProps) {
  const id = useId()
  const titleId = `${id}-title`
  const detailsId = `${id}-details`
  const fallbackName = value === 'primary' ? 'Principal' : 'Secundária'
  const title = wallet.nickname.trim() === '' ? fallbackName : wallet.nickname
  const network = networkLabel(wallet.network)
  const networkLine = value === 'primary' ? `Rede principal ${network}` : `Rede ${network}`

  return (
    <div className="flex h-[93px] items-center rounded-mobile bg-card pr-1.5 pl-[19px] has-data-disabled:opacity-50">
      <RadioGroupItem
        id={id}
        value={value}
        disabled={disabled}
        aria-labelledby={titleId}
        aria-describedby={detailsId}
        className="shrink-0"
      />
      <label htmlFor={id} className="ml-[19px] flex min-w-0 flex-1 cursor-pointer flex-col">
        <span id={titleId} className="truncate text-sm font-bold text-foreground">
          {title}
        </span>
        <span id={detailsId} className="flex flex-col text-sm leading-[22px] text-muted-foreground">
          <span>{shortAddress(wallet.address)}</span>
          <span>{networkLine}</span>
        </span>
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Opções da carteira ${title}`}
            disabled={disabled}
          >
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>Editar carteira</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
