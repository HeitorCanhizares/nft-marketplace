export type SeedCoupon = {
  code: string
  percent: number
  expired: boolean
}

export type CouponTerms = {
  percent: number
  expired: boolean
}

export const seedCoupons: readonly SeedCoupon[] = [
  { code: 'KURIO10', percent: 10, expired: false },
  { code: 'GENESIS5', percent: 5, expired: false },
  { code: 'EXPIRADO', percent: 10, expired: true },
]

export function findCoupon(code: string): CouponTerms | undefined {
  const normalized = code.trim().toUpperCase()
  const coupon = seedCoupons.find((item) => item.code === normalized)
  return coupon ? { percent: coupon.percent, expired: coupon.expired } : undefined
}
