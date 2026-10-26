import { useState } from 'react'
import { ArrowRightIcon, PauseIcon, PlayIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { useCarouselAutoplay } from '@/hooks/useCarouselAutoplay'
import { cn } from '@/lib/utils'
import type { NftSummary } from '@/types/nft'

type HeroBannerProps = {
  slides: NftSummary[]
  variant: 'desktop' | 'mobile'
  onExplore: () => void
  className?: string
}

const COPY = {
  desktop: {
    title: 'SEJA DONO DO FUTURO DA ARTE DIGITAL',
    text: 'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.',
  },
  mobile: {
    title: 'SEJA DONO DA CULTURA DIGITAL',
    text: 'Descubra NFTs selecionados de criadores do mundo todo.',
  },
} as const

export function HeroBanner({ slides, variant, onExplore, className }: HeroBannerProps) {
  const [api, setApi] = useState<CarouselApi>()
  const { running, reducedMotion, userPaused, toggle, containerProps } = useCarouselAutoplay(api)

  const isDesktop = variant === 'desktop'
  const total = slides.length
  const copy = COPY[variant]

  const pauseButton = reducedMotion ? null : (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={userPaused ? 'Retomar rotação dos destaques' : 'Pausar rotação dos destaques'}
      aria-pressed={userPaused}
      onClick={toggle}
      className={cn(
        'size-6 text-foreground',
        isDesktop ? 'col-start-3 ml-3 justify-self-start' : 'ml-3',
      )}
    >
      {userPaused ? <PlayIcon className="size-3.5" /> : <PauseIcon className="size-3.5" />}
    </Button>
  )

  return (
    <section
      aria-label="Destaques"
      className={cn(
        'relative w-full',
        isDesktop ? 'h-112.5' : 'h-47.5 overflow-hidden rounded-panel',
        className,
      )}
      {...containerProps}
    >
      {isDesktop ? null : (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-panel bg-gradient-primary opacity-[0.55]"
          />
          <div
            aria-hidden="true"
            className="absolute -top-8 -right-8 size-32 rounded-full bg-foreground/5"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-10 left-1/3 size-24 rounded-full bg-foreground/5"
          />
        </>
      )}

      <div
        className={cn(
          'absolute z-10 flex flex-col items-start',
          isDesktop ? 'top-9.75 left-10 max-w-137' : 'top-1.25 left-4 max-w-47',
        )}
      >
        <p className={cn('text-foreground', isDesktop ? 'text-base' : 'text-caption')}>
          Bem-vindo à Kurio
        </p>
        <h2
          className={cn(
            'font-bold text-foreground',
            isDesktop ? 'mt-1.25 text-display leading-17.5' : 'mt-1.25 text-lg leading-7.25',
          )}
        >
          {copy.title}
        </h2>
        <p
          className={cn(
            'text-muted-foreground',
            isDesktop ? 'mt-0.75 text-sm leading-6' : 'mt-1.5 text-caption leading-4.5',
          )}
        >
          {copy.text}
        </p>
        {isDesktop ? (
          <Button type="button" onClick={onExplore} className="mt-8 w-35 text-base font-bold">
            EXPLORAR
          </Button>
        ) : (
          <Button
            type="button"
            variant="link"
            onClick={onExplore}
            className="mt-0 h-4 px-0 text-caption font-bold"
          >
            EXPLORAR
            <ArrowRightIcon className="size-4.5" />
          </Button>
        )}
      </div>

      <Carousel
        opts={{ loop: true }}
        setApi={setApi}
        aria-live={running ? 'off' : 'polite'}
        className="absolute inset-0"
      >
        <CarouselContent className="ml-0">
          {slides.map((slide, index) => {
            const label = `Destaque ${index + 1} de ${total}`

            if (isDesktop) {
              return (
                <CarouselItem key={slide.id} aria-label={label} className="flex justify-end pl-0">
                  <img
                    src={slide.image.src}
                    alt={slide.image.alt}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    className="size-112.5 rounded-panel object-cover"
                  />
                </CarouselItem>
              )
            }

            const small = slides[(index + 1) % total]

            return (
              <CarouselItem key={slide.id} aria-label={label} className="relative h-full pl-0">
                <img
                  src={slide.image.src}
                  alt={slide.image.alt}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  className="absolute top-2.5 right-3.75 size-34.5 rounded-media object-cover"
                />
                {small ? (
                  <img
                    src={small.image.src}
                    alt=""
                    loading="lazy"
                    className="absolute top-24.5 left-56.5 size-14.5 rounded-media object-cover"
                  />
                ) : null}
              </CarouselItem>
            )
          })}
        </CarouselContent>

        <div
          className={cn(
            'absolute',
            isDesktop
              ? 'right-0 bottom-8.75 left-10 grid h-6 grid-cols-[1fr_auto_1fr] items-center'
              : 'inset-x-0 bottom-1 flex h-4 items-center justify-center',
          )}
        >
          <CarouselDots
            className={cn(isDesktop ? 'col-start-2' : 'gap-1.75 [&>button]:size-1.5')}
          />
          {pauseButton}
        </div>
      </Carousel>
    </section>
  )
}
