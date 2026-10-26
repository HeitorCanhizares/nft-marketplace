import { ZoomInIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { ImageZoomDialog } from '@/components/shared/ImageZoomDialog'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

type GalleryImage = { src: string; alt: string }

type NftGalleryProps = {
  images: readonly GalleryImage[]
  name: string
  className?: string
}

// Galeria do NFT: miniaturas no desktop, swipe no mobile. Só a variante da largura atual fica no DOM.
export function NftGallery({ images, name, className }: NftGalleryProps) {
  const isDesktop = useIsDesktop()
  const [index, setIndex] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const total = images.length
  const current = images[Math.min(index, total - 1)]

  function openZoom(imageIndex: number): void {
    setIndex(imageIndex)
    setZoomOpen(true)
  }

  return (
    <div className={cn('w-full', className)}>
      {isDesktop ? (
        <div className="flex gap-4">
          {total > 1 ? (
            <div className="flex flex-col gap-3">
              {images.map((image, imageIndex) => (
                <button
                  key={imageIndex}
                  type="button"
                  aria-label={`Imagem ${imageIndex + 1} de ${total}`}
                  aria-current={imageIndex === index ? 'true' : undefined}
                  onClick={() => setIndex(imageIndex)}
                  className={cn(
                    'size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    imageIndex === index ? 'border-primary' : 'border-border-soft',
                  )}
                >
                  <img src={image.src} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
          <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg bg-card">
            <img
              src={current.src}
              alt={current.alt}
              className="aspect-square w-full object-cover"
            />
            <Button
              type="button"
              variant="icon"
              size="icon"
              aria-label="Ampliar imagem"
              onClick={() => openZoom(index)}
              className="absolute right-3 bottom-3 rounded-full bg-card/80 text-foreground"
            >
              <ZoomInIcon aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : (
        <MobileGallery images={images} index={index} onIndexChange={setIndex} onZoom={openZoom} />
      )}

      <ImageZoomDialog
        images={images}
        index={index}
        onIndexChange={setIndex}
        open={zoomOpen}
        onOpenChange={setZoomOpen}
        name={name}
      />
    </div>
  )
}

type MobileGalleryProps = {
  images: readonly GalleryImage[]
  index: number
  onIndexChange: (index: number) => void
  onZoom: (index: number) => void
}

function MobileGallery({ images, index, onIndexChange, onZoom }: MobileGalleryProps) {
  const total = images.length
  const [options] = useState(() => ({ startIndex: index }))
  const [api, setApi] = useState<CarouselApi>()

  // O índice acompanha o slide que o usuário arrastou.
  useEffect(() => {
    if (!api) return
    const handleSelect = () => onIndexChange(api.selectedScrollSnap())
    api.on('select', handleSelect)
    return () => {
      api.off('select', handleSelect)
    }
  }, [api, onIndexChange])

  return (
    <Carousel setApi={setApi} opts={options}>
      <CarouselContent>
        {images.map((image, imageIndex) => (
          <CarouselItem key={imageIndex}>
            <button
              type="button"
              aria-label={`Ampliar imagem ${imageIndex + 1} de ${total}`}
              onClick={() => onZoom(imageIndex)}
              className="block w-full overflow-hidden rounded-mobile outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <img
                src={image.src}
                alt={image.alt}
                loading={imageIndex === index ? undefined : 'lazy'}
                className="aspect-square w-full object-cover"
              />
            </button>
          </CarouselItem>
        ))}
      </CarouselContent>
      {total > 1 ? <CarouselDots className="mt-3 justify-center" /> : null}
    </Carousel>
  )
}
