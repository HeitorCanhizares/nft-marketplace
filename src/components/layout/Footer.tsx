import { WalletBadges } from '@/components/shared/WalletBadges'
import { cn } from '@/lib/utils'

import { FOOTER_COLUMNS } from './footerLinks'
import { FooterHighlights } from './FooterHighlights'
import { FooterLinkColumn } from './FooterLinkColumn'
import { SocialLinks } from './SocialLinks'

type FooterProps = {
  className?: string
}

// Rodapé do desktop: o AppShell esconde-o abaixo de 1024 px (className recebe max-lg:hidden).
export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn('mt-20', className)}>
      <div className="container-page">
        <div className="bg-card">
          <FooterHighlights />

          <div className="grid h-22 grid-cols-[303fr_303fr_302fr_227fr] items-center bg-surface-3 px-8 text-sm text-foreground">
            <p className="font-bold tracking-[0.07em]">KURIO</p>
            <p>Feito para colecionadores, criadores e cultura</p>
            <a href="mailto:contato@email.com" className="hover:text-primary">
              contato@email.com
            </a>
            <a href="tel:+551140028922" className="hover:text-primary">
              +55 11 4002 8922
            </a>
          </div>

          <div className="grid grid-cols-[303fr_303fr_302fr_227fr] px-8 pt-6 pb-9">
            {FOOTER_COLUMNS.map((column) => (
              <FooterLinkColumn key={column.title} column={column} />
            ))}

            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-lg leading-8 font-bold text-foreground">Redes sociais</h2>
                <SocialLinks />
              </div>

              <div>
                <h2 className="text-lg leading-8 font-bold text-foreground">
                  Carteiras compatíveis
                </h2>
                <WalletBadges />
              </div>
            </div>
          </div>
        </div>

        <p className="pt-3 pb-7 text-center text-sm text-foreground">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  )
}
