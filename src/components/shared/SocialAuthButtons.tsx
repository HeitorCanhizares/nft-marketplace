import facebookIconUrl from '@/assets/icons/facebook-color.svg'
import googleIconUrl from '@/assets/icons/google.svg'
import { ComingSoon } from '@/components/shared/ComingSoon'
import { cn } from '@/lib/utils'

const SOCIAL_BUTTON_CLASS =
  'flex h-10 w-full items-center justify-center gap-3 rounded-lg border border-border text-caption-md text-muted-foreground'

type SocialAuthButtonsProps = {
  className?: string
}

// Login social ainda não existe: os botões aparecem desabilitados com "Em breve".
export function SocialAuthButtons({ className }: SocialAuthButtonsProps) {
  return (
    <div
      role="group"
      aria-label="Entrar com outra conta"
      className={cn('flex flex-col gap-4', className)}
    >
      <ComingSoon className={SOCIAL_BUTTON_CLASS}>
        <img src={googleIconUrl} alt="" className="h-5 w-auto" />
        Continuar com Google
      </ComingSoon>
      <ComingSoon className={SOCIAL_BUTTON_CLASS}>
        <img src={facebookIconUrl} alt="" className="h-5 w-auto" />
        Continuar com Facebook
      </ComingSoon>
    </div>
  )
}
