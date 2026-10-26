import type { ReactNode } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CATALOG_TABS } from '@/lib/catalogOptions'
import { cn } from '@/lib/utils'
import type { CatalogTab } from '@/types/catalog'

type CatalogTabsProps = {
  value: CatalogTab
  onValueChange: (value: CatalogTab) => void
  // Ordenação, no desktop.
  trailing?: ReactNode
  children: ReactNode
  className?: string
}

export function CatalogTabs({
  value,
  onValueChange,
  trailing,
  children,
  className,
}: CatalogTabsProps) {
  return (
    <Tabs
      value={value}
      activationMode="manual"
      onValueChange={(next) => {
        const tab = CATALOG_TABS.find((candidate) => candidate.value === next)
        if (tab) onValueChange(tab.value)
      }}
      className={cn('gap-0', className)}
    >
      <div className="flex items-center justify-between gap-4">
        <TabsList aria-label="Categorias do catálogo" className="min-w-0 flex-wrap gap-4 lg:gap-5">
          {CATALOG_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="px-0 text-sm lg:px-1 lg:text-body"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {trailing}
      </div>

      <TabsContent value={value} className="mt-4 lg:mt-7">
        {children}
      </TabsContent>
    </Tabs>
  )
}
