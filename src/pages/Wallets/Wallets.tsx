import { Link, useNavigate } from '@tanstack/react-router'

import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { ErrorState } from '@/components/shared/ErrorState'
import { UnsavedChangesGuard } from '@/components/shared/UnsavedChangesGuard'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useWallets } from '@/hooks/useWallets'
import { PrimaryWalletSection } from '@/pages/Wallets/PrimaryWalletSection'
import { SecondaryWalletSection } from '@/pages/Wallets/SecondaryWalletSection'
import { WalletsSkeleton } from '@/pages/Wallets/WalletsSkeleton'
import { useWalletSlotForm } from '@/pages/Wallets/useWalletSlotForm'
import type { WalletsResponse } from '@/types/user'

type WalletsProps = {
  redirect: string | undefined
}

// Cabeçalho por viewport: no desktop o título visível é o do bloco; no mobile, a barra superior.
function PageHeader({ isDesktop, redirect }: { isDesktop: boolean; redirect: string | undefined }) {
  if (!isDesktop) {
    return (
      <MobileTopBar
        title="Carteiras"
        backTo={redirect ? { to: '/pagamento' } : { to: '/perfil' }}
      />
    )
  }

  return <h1 className="sr-only">Carteiras</h1>
}

type WalletsContentProps = {
  data: WalletsResponse
  redirect: string | undefined
}

// Os dois formulários só montam com os dados, para não chamar hooks de forma condicional.
function WalletsContent({ data, redirect }: WalletsContentProps) {
  const navigate = useNavigate()

  // Com ?redirect=/pagamento, salvar (principal ou secundária) volta ao Pagamento.
  const onSaved = redirect
    ? () => {
        void navigate({ to: '/pagamento', replace: true })
      }
    : undefined

  const primaryForm = useWalletSlotForm('primary', data.primary, { onSaved })
  const secondaryForm = useWalletSlotForm('secondary', data.secondary, { onSaved })
  const anyDirty = primaryForm.isDirty || secondaryForm.isDirty

  return (
    <div className="flex w-full flex-col gap-8 lg:w-[862px] lg:gap-[35px]">
      {redirect && (
        <Link
          to="/pagamento"
          className="text-base font-bold text-primary hover:underline max-lg:hidden"
        >
          ← Voltar ao pagamento
        </Link>
      )}

      <PrimaryWalletSection wallet={data.primary} slotForm={primaryForm} />
      <SecondaryWalletSection
        wallet={data.secondary}
        primary={data.primary}
        slotForm={secondaryForm}
        anyDirty={anyDirty}
      />

      <UnsavedChangesGuard when={anyDirty && !primaryForm.isSaving && !secondaryForm.isSaving} />
    </div>
  )
}

// Página de carteiras: liga a consulta às telas (carregando, erro e formulários).
export function Wallets({ redirect }: WalletsProps) {
  const isDesktop = useIsDesktop()
  const walletsQuery = useWallets()
  const data = walletsQuery.data

  let content
  if (data !== undefined) {
    content = <WalletsContent data={data} redirect={redirect} />
  } else if (walletsQuery.isError) {
    content = (
      <ErrorState
        as="h2"
        onRetry={() => {
          void walletsQuery.refetch()
        }}
        retrying={walletsQuery.isFetching}
      />
    )
  } else {
    content = <WalletsSkeleton />
  }

  return (
    <>
      <PageHeader isDesktop={isDesktop} redirect={redirect} />
      <div className="flex flex-col px-7 pb-8 lg:px-0">{content}</div>
    </>
  )
}
