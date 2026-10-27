import { Loader2Icon } from 'lucide-react'

import { AUTH_SUBMIT_CLASS } from '@/components/shared/authStyles'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type WalletSaveButtonProps = {
  isSaving: boolean
  disabled: boolean
}

export function WalletSaveButton({ isSaving, disabled }: WalletSaveButtonProps) {
  return (
    <Button
      type="submit"
      disabled={disabled || isSaving}
      aria-busy={isSaving || undefined}
      className={cn(AUTH_SUBMIT_CLASS, 'lg:h-10 lg:w-[131px] lg:text-sm lg:font-bold')}
    >
      {isSaving && <Loader2Icon aria-hidden="true" className="motion-safe:animate-spin" />}
      Salvar carteira
    </Button>
  )
}
