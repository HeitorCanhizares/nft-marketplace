import type { ReactNode } from 'react'
import type { LinkProps } from '@tanstack/react-router'

import { Breadcrumb, type BreadcrumbEntry } from '@/components/layout/Breadcrumb'
import { MobileTopBar } from '@/components/layout/MobileTopBar'

type PageHeaderProps = {
  title: string
  isDesktop: boolean
  breadcrumb?: BreadcrumbEntry[]
  backTo?: LinkProps
  fallbackTo?: LinkProps
  action?: ReactNode
}

// Cabeçalho das páginas: no mobile, a barra superior; no desktop, o breadcrumb (se houver) e o h1 oculto.
export function PageHeader({
  title,
  isDesktop,
  breadcrumb,
  backTo,
  fallbackTo,
  action,
}: PageHeaderProps) {
  if (!isDesktop) {
    return <MobileTopBar title={title} backTo={backTo} fallbackTo={fallbackTo} action={action} />
  }

  return (
    <>
      {breadcrumb ? <Breadcrumb items={breadcrumb} className="mb-2.5" /> : null}
      <h1 className="sr-only max-lg:hidden">{title}</h1>
    </>
  )
}
