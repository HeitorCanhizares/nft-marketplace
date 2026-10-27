import { Breadcrumb, type BreadcrumbEntry } from '@/components/layout/Breadcrumb'

import { CollectorSection } from './CollectorSection'
import { OrderSummaryColumn } from './OrderSummaryColumn'
import type { CheckoutViewProps } from './viewProps'

const BREADCRUMB: BreadcrumbEntry[] = [
  { label: 'Início', link: { to: '/' } },
  { label: 'Mercado', link: { to: '/', hash: 'catalogo' } },
  { label: 'Pagamento' },
]

// Tela desktop do Pagamento: perfil do colecionador à esquerda e pedido à direita.
export function CheckoutDesktop(props: CheckoutViewProps) {
  return (
    <div className="container-page flex flex-col pb-16">
      <Breadcrumb items={BREADCRUMB} className="mb-2.5" />
      <h1 className="sr-only">Pagamento</h1>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_405px]">
        <CollectorSection form={props.form} />
        <OrderSummaryColumn {...props} />
      </div>
    </div>
  )
}
