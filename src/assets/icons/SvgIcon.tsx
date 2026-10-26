import type { CSSProperties } from 'react'

import { cn } from '@/lib/utils'

import arrowDownUrl from './arrow-down.svg'
import messageUrl from './message.svg'
import searchUrl from './search.svg'
import shopUrl from './shop.svg'
import userUrl from './user.svg'
import xUrl from './x.svg'

const ICONS = {
  message: { src: messageUrl, size: 18 },
  x: { src: xUrl, size: 18 },
  'arrow-down': { src: arrowDownUrl, size: 20 },
  search: { src: searchUrl, size: 22 },
  user: { src: userUrl, size: 20 },
  shop: { src: shopUrl, size: 20 },
} as const

export type SvgIconName = keyof typeof ICONS

export type SvgIconProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  name: SvgIconName
  size?: number
  title?: string
}

export function SvgIcon({ name, size, className, style, title, ...props }: SvgIconProps) {
  const icon = ICONS[name]
  const dimension = size ?? icon.size
  const maskStyle: CSSProperties = {
    width: dimension,
    height: dimension,
    maskImage: `url("${icon.src}")`,
    WebkitMaskImage: `url("${icon.src}")`,
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
  }

  const accessibilityProps = title
    ? { role: 'img' as const, 'aria-label': title }
    : { 'aria-hidden': 'true' as const }

  return (
    <span
      {...props}
      {...accessibilityProps}
      className={cn('inline-block shrink-0 bg-current', className)}
      style={{ ...maskStyle, ...style }}
    />
  )
}
