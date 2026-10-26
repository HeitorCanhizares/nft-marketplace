import { useId } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CATALOG_SORTS } from '@/lib/catalogOptions'
import { cn } from '@/lib/utils'
import type { CatalogSort } from '@/types/catalog'

type SortSelectProps = {
  value: CatalogSort
  onValueChange: (value: CatalogSort) => void
  variant?: 'inline' | 'field'
  className?: string
}

export function SortSelect({
  value,
  onValueChange,
  variant = 'inline',
  className,
}: SortSelectProps) {
  const triggerId = useId()

  const handleValueChange = (next: string) => {
    const sort = CATALOG_SORTS.find((candidate) => candidate.value === next)
    if (sort) onValueChange(sort.value)
  }

  const items = CATALOG_SORTS.map((sort) => (
    <SelectItem key={sort.value} value={sort.value}>
      {sort.label}
    </SelectItem>
  ))

  if (variant === 'field') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <Label htmlFor={triggerId}>Ordenar por</Label>
        <Select value={value} onValueChange={handleValueChange}>
          <SelectTrigger id={triggerId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{items}</SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger
        className={cn('h-auto w-auto gap-2 border-0 bg-transparent px-0 text-body', className)}
      >
        <span className="text-foreground">Ordenar por:</span> <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        {items}
      </SelectContent>
    </Select>
  )
}
