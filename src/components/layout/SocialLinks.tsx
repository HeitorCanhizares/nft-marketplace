import { SvgIcon, type SvgIconName } from '@/assets/icons/SvgIcon'
import { ComingSoon } from '@/components/shared/ComingSoon'

// Redes sociais desabilitadas: ainda não há endereço das redes (04-016).
const SOCIAL_LINKS: { label: string; icon: SvgIconName }[] = [
  { label: 'Facebook', icon: 'facebook' },
  { label: 'Instagram', icon: 'instagram' },
  { label: 'Twitter', icon: 'twitter' },
  { label: 'LinkedIn', icon: 'linkedin' },
  { label: 'YouTube', icon: 'youtube' },
]

export function SocialLinks() {
  return (
    <ul aria-label="Redes sociais" className="flex items-center gap-2">
      {SOCIAL_LINKS.map((link) => (
        <li key={link.label}>
          <ComingSoon
            aria-label={link.label}
            className="flex size-8 items-center justify-center rounded-lg border border-primary text-primary"
          >
            <SvgIcon name={link.icon} />
          </ComingSoon>
        </li>
      ))}
    </ul>
  )
}
