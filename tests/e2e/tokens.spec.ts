import { expect, test } from '@playwright/test'

const rootVar = (name: string) => `--${name}`

function luminance(hex: string) {
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

const pairs: Array<[string, string, number]> = [
  ['foreground', 'background', 4.5],
  ['foreground', 'card', 4.5],
  ['muted-foreground', 'background', 4.5],
  ['muted-foreground', 'card', 4.5],
  ['price', 'background', 4.5],
  ['price', 'card', 4.5],
  ['primary', 'background', 4.5],
  ['primary', 'card', 4.5],
  ['primary-foreground', 'primary', 4.5],
  ['destructive', 'card', 4.5],
  ['success', 'card', 4.5],
  ['required', 'card', 4.5],
  ['tan', 'background', 4.5],
  ['tan', 'card', 4.5],
  ['ring', 'background', 3],
]

test('contraste dos tokens de cor', async ({ page }) => {
  await page.goto('/')
  const names = [...new Set(pairs.flatMap(([a, b]) => [a, b]))]
  const tokens = await page.evaluate<Record<string, string>>(
    `(() => { const s = getComputedStyle(document.documentElement); const o = {}; for (const n of ${JSON.stringify(names)}) o[n] = s.getPropertyValue('--' + n).trim(); return o })()`,
  )

  const failures: string[] = []
  for (const [fg, bg, min] of pairs) {
    const ratio = contrast(tokens[fg]!, tokens[bg]!)
    if (ratio < min)
      failures.push(`${rootVar(fg)} sobre ${rootVar(bg)}: ${ratio.toFixed(2)} < ${min}`)
  }
  expect(failures).toEqual([])
})
