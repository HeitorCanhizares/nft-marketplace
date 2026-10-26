import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import type { KeyboardEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

type ZoomImage = { src: string; alt: string }

type ImageZoomDialogProps = {
  images: readonly ZoomImage[]
  index: number
  onIndexChange: (index: number) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
}

// Imagem ampliada do NFT. Esc fecha e o Radix devolve o foco ao gatilho.
export function ImageZoomDialog({
  images,
  index,
  onIndexChange,
  open,
  onOpenChange,
  name,
}: ImageZoomDialogProps) {
  const total = images.length
  const current = images[Math.min(index, total - 1)]
  const hasPrevious = index > 0
  const hasNext = index < total - 1

  function previous(): void {
    if (hasPrevious) onIndexChange(index - 1)
  }

  function next(): void {
    if (hasNext) onIndexChange(index + 1)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      previous()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      next()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onKeyDown={handleKeyDown}
        className="max-w-[min(92vw,960px)] p-2 sm:max-w-[min(92vw,960px)] lg:p-4"
      >
        <DialogTitle className="sr-only">Imagem ampliada de {name}</DialogTitle>
        <DialogDescription className="sr-only">
          Use as setas do teclado ou os botões para trocar a imagem.
        </DialogDescription>
        <div className="flex max-h-[80dvh] items-center justify-center overflow-hidden">
          <img
            src={current.src}
            alt={current.alt}
            className="max-h-[80dvh] w-full object-contain"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Imagem anterior"
            disabled={!hasPrevious}
            onClick={previous}
          >
            <ChevronLeftIcon aria-hidden="true" />
          </Button>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {`Imagem ${index + 1} de ${total}`}
          </p>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Próxima imagem"
            disabled={!hasNext}
            onClick={next}
          >
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
