import { ArrowRightIcon } from 'lucide-react'

import { ComingSoon } from '@/components/shared/ComingSoon'
import { cn } from '@/lib/utils'
import type { Post } from '@/types/nft'

type BlogCardProps = {
  post: Post
  className?: string
}

export function BlogCard({ post, className }: BlogCardProps) {
  const meta = `${post.date}, leitura de ${post.readingMinutes} min`

  return (
    <article className={cn('flex flex-col overflow-hidden rounded-media bg-card', className)}>
      <img
        src={post.image.src}
        alt={post.image.alt}
        loading="lazy"
        className="h-48.75 w-full object-cover"
      />

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <p className="text-caption text-muted-foreground">
          <span className="sr-only">{meta}</span>
          <span aria-hidden="true">
            {post.date} <span>|</span> Leitura de {post.readingMinutes} min
          </span>
        </p>
        <h3 className="text-base font-bold text-foreground">{post.title}</h3>
        <p className="text-caption text-muted-foreground">{post.summary}</p>

        <ComingSoon
          aria-label={`Ler mais sobre ${post.title}`}
          className="mt-auto self-start text-caption font-bold text-primary"
        >
          Ler mais
          <ArrowRightIcon aria-hidden="true" className="size-3" />
        </ComingSoon>
      </div>
    </article>
  )
}
