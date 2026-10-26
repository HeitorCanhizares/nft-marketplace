import { MailIcon } from 'lucide-react'

import { SvgIcon } from '@/assets/icons/SvgIcon'
import { cn } from '@/lib/utils'

type ShareLinksProps = {
  // URL pública do NFT (ex.: origem + /nft/<id>): é a única coisa que sai nos links.
  url: string
  title: string
  className?: string
}

const linkClass =
  'inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring'

export function ShareLinks({ url, title, className }: ShareLinksProps) {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <span className="text-sm text-muted-foreground">Compartilhar este NFT:</span>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no LinkedIn (abre em nova aba)"
        className={linkClass}
      >
        <SvgIcon name="linkedin" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no Twitter (abre em nova aba)"
        className={linkClass}
      >
        <SvgIcon name="twitter" />
      </a>
      <a
        href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
        aria-label="Compartilhar por e-mail"
        className={linkClass}
      >
        <MailIcon aria-hidden="true" className="size-4" />
      </a>
    </div>
  )
}
