import { Link } from '@tanstack/react-router'

import { ComingSoon } from '@/components/shared/ComingSoon'

import type { FooterColumn } from './footerLinks'

type FooterLinkColumnProps = {
  column: FooterColumn
}

export function FooterLinkColumn({ column }: FooterLinkColumnProps) {
  return (
    <nav aria-label={column.title}>
      <h2 className="text-lg leading-8 font-bold text-foreground">{column.title}</h2>
      <ul className="flex flex-col">
        {column.links.map((link) => (
          <li key={link.label} className="flex h-7.5 items-center">
            {link.disabled || !link.to ? (
              <ComingSoon className="text-sm text-foreground">{link.label}</ComingSoon>
            ) : (
              <Link
                to={link.to}
                search={link.search}
                resetScroll={link.search ? false : undefined}
                className="text-sm text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
