import { Fragment } from 'react'
import { Link, type LinkProps } from '@tanstack/react-router'

import * as Ui from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'

export type BreadcrumbEntry = { label: string; link?: LinkProps }

type BreadcrumbProps = {
  items: BreadcrumbEntry[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <Ui.Breadcrumb className={cn('max-lg:hidden', className)}>
      <Ui.BreadcrumbList>
        {items.map((entry, index) => {
          const isLast = index === items.length - 1

          return (
            <Fragment key={`${index}-${entry.label}`}>
              {index > 0 ? <Ui.BreadcrumbSeparator /> : null}
              <Ui.BreadcrumbItem>
                {entry.link && !isLast ? (
                  <Ui.BreadcrumbLink asChild>
                    <Link {...entry.link}>{entry.label}</Link>
                  </Ui.BreadcrumbLink>
                ) : (
                  <Ui.BreadcrumbPage>{entry.label}</Ui.BreadcrumbPage>
                )}
              </Ui.BreadcrumbItem>
            </Fragment>
          )
        })}
      </Ui.BreadcrumbList>
    </Ui.Breadcrumb>
  )
}
