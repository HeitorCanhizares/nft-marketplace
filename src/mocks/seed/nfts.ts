import type { Edition, Network, NftDetail } from '@/types/nft'
import type { NftStats } from '../db/db'
import apeGreenJacket from '@/assets/nfts/ape-green-jacket.webp'
import apeOrangeHeadphones from '@/assets/nfts/ape-orange-headphones.webp'
import gorillaBlackBlazer from '@/assets/nfts/gorilla-black-blazer.webp'
import gorillaPurpleHoodie from '@/assets/nfts/gorilla-purple-hoodie.webp'
import { seedCollections } from './collections'

// Tudo abaixo é determinístico: mesma semente e mesma data de referência geram sempre o mesmo catálogo.
const SEED = 20261025
const REFERENCE_MS = Date.UTC(2026, 9, 25, 12, 0, 0)
const DAY_MS = 24 * 60 * 60 * 1000
const TOTAL_NFTS = 283
const NETWORK_COUNTS: readonly { network: Network; count: number }[] = [
  { network: 'ethereum', count: 119 },
  { network: 'polygon', count: 78 },
  { network: 'solana', count: 86 },
]
const NETWORK_NAMES: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

type Rand = () => number
type BaseImage = { src: string; alt: string }

const BASE_IMAGES: readonly BaseImage[] = [
  { src: apeGreenJacket, alt: 'Macaco de óculos escuros e jaqueta verde' },
  { src: apeOrangeHeadphones, alt: 'Macaco laranja com fones de ouvido verdes' },
  { src: gorillaPurpleHoodie, alt: 'Gorila cinza de capuz roxo e chapéu verde' },
  { src: gorillaBlackBlazer, alt: 'Gorila preto de blazer bege e gola verde' },
]

export const SEED_IMAGE_URLS: readonly string[] = BASE_IMAGES.map((image) => image.src)

// Os 9 primeiros itens reproduzem a primeira página do Figma, na mesma ordem da grade.
// `image` é o índice em BASE_IMAGES.
const FIGMA_NFTS: readonly {
  name: string
  number: number
  cents: number
  image: number
  previousCents?: number
  rare?: boolean
  rating?: { average: number; count: number }
}[] = [
  { name: 'Emerald Ape', number: 42, cents: 119, image: 0, rating: { average: 4.8, count: 19 } },
  { name: 'Sage Nomad', number: 9, cents: 169, image: 2 },
  { name: 'Neon Vessel', number: 552, cents: 199, previousCents: 229, rare: true, image: 3 },
  { name: 'Cosmic Bloom', number: 118, cents: 129, image: 2 },
  { name: 'Violet Nomad', number: 314, cents: 139, image: 2 },
  { name: 'Ivory Baron', number: 88, cents: 179, image: 3 },
  { name: 'Golden Beat', number: 207, cents: 99, image: 1 },
  { name: 'Golden Frequency', number: 71, cents: 59, image: 1 },
  { name: 'Golden Signal', number: 160, cents: 39, image: 1 },
]

const ADJECTIVES = [
  'Azure',
  'Crimson',
  'Amber',
  'Silver',
  'Lunar',
  'Solar',
  'Velvet',
  'Coral',
  'Indigo',
  'Ember',
  'Quartz',
  'Cobalt',
  'Mint',
  'Onyx',
  'Pearl',
  'Rust',
  'Cedar',
  'Opal',
  'Jade',
  'Scarlet',
]

const NOUNS = [
  'Pilot',
  'Oracle',
  'Drift',
  'Monolith',
  'Harbor',
  'Comet',
  'Relic',
  'Signal',
  'Voyager',
  'Bloom',
  'Sentinel',
  'Garden',
  'Prism',
  'Echo',
  'Lantern',
  'Atlas',
  'Mirage',
  'Keeper',
  'Orbit',
  'Ripple',
]

const ATTRIBUTES = [
  'Óculos',
  'Esmeralda',
  'Fundo verde-sálvia',
  'Capuz roxo',
  'Chapéu bege',
  'Fones de ouvido',
  'Blazer bege',
  'Fundo creme',
  'Olhar sereno',
  'Brilho dourado',
  'Pulseira de cobre',
  'Gola verde',
]

const EDITION_SPECS: readonly { label: string; supply: number | null }[] = [
  { label: '1/1', supply: 1 },
  { label: '1/10', supply: 10 },
  { label: '1/50', supply: 50 },
  { label: 'ABERTA', supply: null },
]
const LIMITED_SPECS = EDITION_SPECS.filter((spec) => spec.supply !== null)

const GENERATED_COUNT = TOTAL_NFTS - FIGMA_NFTS.length

const EMERALD_APE_ID = 'emerald-ape-042'

// Sobrescreve só o Emerald Ape #042 com os dados do Figma (imagens, edições e textos). O preço vem da edição 1/50.
function applyEmeraldApe(nft: NftDetail): void {
  const id = EMERALD_APE_ID
  const editions: Edition[] = [
    { id: `${id}-1-1`, label: '1/1', supply: 1, available: 1, price: '1.49' },
    { id: `${id}-1-10`, label: '1/10', supply: 10, available: 6, price: '1.39' },
    { id: `${id}-1-50`, label: '1/50', supply: 50, available: 20, price: '1.19' },
    { id: `${id}-aberta`, label: 'ABERTA', supply: null, available: null, price: '1.29' },
  ]
  nft.images = BASE_IMAGES.map((image) => ({ ...image }))
  nft.image = { ...nft.images[0] }
  nft.price = '1.19'
  nft.editions = editions
  nft.attributes = ['Óculos', 'Esmeralda', 'Raro']
  nft.description =
    'Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.'
}

type Plan = {
  name: string
  number: number
  cents: number
  previousCents?: number
  rare: boolean
  image: number
  rating?: { average: number; count: number }
  soldOut: boolean
  lowStock: boolean
  offset: number
  collection: { id: string; name: string }
  network: Network
}

type SeedEntry = { offset: number; createdAt: string; nft: NftDetail }

function mulberry32(seed: number): Rand {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function int(rand: Rand, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1))
}

function pick<T>(rand: Rand, items: readonly T[]): T {
  return items[int(rand, 0, items.length - 1)]
}

function shuffle<T>(rand: Rand, items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = int(rand, 0, i)
    const current = copy[i]
    copy[i] = copy[j]
    copy[j] = current
  }
  return copy
}

function hex(rand: Rand, length: number): string {
  let out = ''
  for (let i = 0; i < length; i++) out += '0123456789abcdef'[int(rand, 0, 15)]
  return out
}

function toEth(cents: number): string {
  return (cents / 100).toFixed(2)
}

// Média sempre alcançável com notas inteiras de 1 a 5: sorteia a soma S de `count` notas entre
// ceil(3.5 * count) e 5 * count, e a média é S / count.
function buildRating(rand: Rand): { average: number; count: number } {
  const count = int(rand, 0, 25)
  if (count === 0) return { average: 0, count: 0 }
  const sum = int(rand, Math.ceil(3.5 * count), 5 * count)
  return { average: Number((sum / count).toFixed(1)), count }
}

function buildNft(rand: Rand, plan: Plan): SeedEntry {
  const tokenNumber = String(plan.number).padStart(3, '0')
  const id = `${plan.name.toLowerCase().replace(/ /g, '-')}-${tokenNumber}`

  const specPool = plan.soldOut ? LIMITED_SPECS : EDITION_SPECS
  const specs = shuffle(rand, specPool).slice(0, int(rand, 1, specPool.length))
  const editions: Edition[] = specs.map((spec, index) => {
    let available: number | null
    if (spec.supply === null) available = null
    else if (plan.soldOut) available = 0
    else if (plan.lowStock) available = Math.min(int(rand, 1, 3), spec.supply)
    else available = spec.supply === 1 ? 1 : int(rand, 4, spec.supply)
    // A primeira edição carrega o preço do NFT; as demais ficam acima dele.
    const cents = index === 0 ? plan.cents : plan.cents + int(rand, 10, 200)
    return {
      id: `${id}-${spec.label.toLowerCase().replace('/', '-')}`,
      label: spec.label,
      supply: spec.supply,
      available,
      price: toEth(cents),
    }
  })

  // Preço do NFT = menor preço entre as edições com estoque; se esgotado, menor entre todas.
  const sellable = editions.filter((edition) => edition.available === null || edition.available > 0)
  const priceSource = sellable.length > 0 ? sellable : editions
  const price = priceSource.reduce(
    (min, edition) => (Number(edition.price) < Number(min) ? edition.price : min),
    priceSource[0].price,
  )

  const otherImages = shuffle(
    rand,
    BASE_IMAGES.map((_, index) => index).filter((index) => index !== plan.image),
  )
  const images = [plan.image, ...otherImages.slice(0, int(rand, 1, 4) - 1)].map((index) => ({
    ...BASE_IMAGES[index],
  }))

  const attributes = shuffle(rand, ATTRIBUTES).slice(0, 3)
  const rating = plan.rating ?? buildRating(rand)

  const nft: NftDetail = {
    id,
    name: `${plan.name} #${tokenNumber}`,
    tokenId: `#${String(plan.number).padStart(4, '0')}`,
    image: { ...images[0] },
    price,
    ...(plan.previousCents !== undefined ? { previousPrice: toEth(plan.previousCents) } : {}),
    ...(plan.rare ? { rarity: 'rare' as const } : {}),
    collection: plan.collection,
    network: plan.network,
    description: `Peça da coleção ${plan.collection.name}, criada a partir da arte-base da Kurio e disponível em edições limitadas.`,
    images,
    editions,
    attributes,
    rating,
    details: {
      body: 'Arte digital em arquivo WebP de 800 × 800 px',
      network: NETWORK_NAMES[plan.network],
      contract: `0x${hex(rand, 40)}`,
      royalties: pick(rand, ['2,5%', '5%', '7,5%', '10%']),
    },
  }

  return {
    offset: plan.offset,
    createdAt: new Date(REFERENCE_MS - plan.offset * DAY_MS).toISOString(),
    nft,
  }
}

function buildEntries(): SeedEntry[] {
  const rand = mulberry32(SEED)

  const collectionPool = shuffle(
    rand,
    seedCollections.flatMap((collection) =>
      Array.from({ length: collection.targetCount }, () => ({
        id: collection.id,
        name: collection.name,
      })),
    ),
  )
  const networkPool = shuffle(
    rand,
    NETWORK_COUNTS.flatMap(({ network, count }) => Array.from({ length: count }, () => network)),
  )
  const slot = (index: number) => ({
    collection: collectionPool[index],
    network: networkPool[index],
  })

  const figmaNumbers = new Set(FIGMA_NFTS.map((nft) => nft.number))
  const numberPool = shuffle(
    rand,
    Array.from({ length: 999 }, (_, index) => index + 1).filter((n) => !figmaNumbers.has(n)),
  ).slice(0, GENERATED_COUNT)

  const generatedOrder = shuffle(
    rand,
    Array.from({ length: GENERATED_COUNT }, (_, index) => index),
  )
  const rareSet = new Set(generatedOrder.slice(0, 4))
  const previousSet = new Set(generatedOrder.slice(4, 11))

  const plans: Plan[] = FIGMA_NFTS.map((nft, index) => ({
    name: nft.name,
    number: nft.number,
    cents: nft.cents,
    previousCents: nft.previousCents,
    rare: nft.rare === true,
    image: nft.image,
    rating: nft.rating,
    soldOut: false,
    lowStock: false,
    offset: index,
    ...slot(index),
  }))

  for (let g = 0; g < GENERATED_COUNT; g++) {
    const cents = int(rand, 5, 450)
    plans.push({
      name: `${pick(rand, ADJECTIVES)} ${pick(rand, NOUNS)}`,
      number: numberPool[g],
      cents,
      previousCents: previousSet.has(g) ? cents + int(rand, 20, 150) : undefined,
      rare: rareSet.has(g),
      image: int(rand, 0, BASE_IMAGES.length - 1),
      soldOut: g % 23 === 7,
      lowStock: g % 7 === 3,
      // Os 30 primeiros gerados ficam nos últimos 30 dias (com os 9 do Figma: 39 no total).
      offset: g < 30 ? int(rand, 9, 29) : int(rand, 30, 119),
      ...slot(FIGMA_NFTS.length + g),
    })
  }

  // Emerald Ape #042 fica em "Arte digital": troca a coleção com o primeiro gerado dessa coleção,
  // para as contagens por coleção não mudarem.
  const emeraldPlan = plans[0]
  const arteDigitalPartner = plans.find(
    (plan, index) => index >= FIGMA_NFTS.length && plan.collection.id === 'arte-digital',
  )
  if (arteDigitalPartner !== undefined && emeraldPlan.collection.id !== 'arte-digital') {
    const emeraldCollection = emeraldPlan.collection
    emeraldPlan.collection = arteDigitalPartner.collection
    arteDigitalPartner.collection = emeraldCollection
  }

  const entries = plans.map((plan) => buildNft(rand, plan))
  for (const entry of entries) {
    if (entry.nft.id === EMERALD_APE_ID) applyEmeraldApe(entry.nft)
  }
  // Mais recentes primeiro; o sort é estável, então empates mantêm a ordem de geração.
  return entries.sort((a, b) => a.offset - b.offset)
}

const SEED_ENTRIES = buildEntries()

export function buildSeedNfts(): NftDetail[] {
  return buildEntries().map((entry) => entry.nft)
}

// Data de criação de cada NFT (ISO), fora de NftDetail. Usada pela aba "Novos lançamentos" (últimos 30 dias).
export const SEED_NFT_CREATED_AT: Readonly<Record<string, string>> = Object.fromEntries(
  SEED_ENTRIES.map((entry) => [entry.nft.id, entry.createdAt]),
)

// Usuário de teste: 12 favoritos (os 9 do Figma e os 3 seguintes da ordem).
export const SEED_FAVORITE_IDS: readonly string[] = SEED_ENTRIES.slice(0, 12).map(
  (entry) => entry.nft.id,
)

// Estatísticas com semente própria: não consome o gerador do catálogo, então o catálogo não muda.
function buildSeedStats(): Record<string, NftStats> {
  const rand = mulberry32(SEED ^ 0x5eed)
  const stats: Record<string, NftStats> = {}
  SEED_ENTRIES.forEach((entry, index) => {
    const sales7d = int(rand, 0, 40)
    const favorites7d = int(rand, 0, 60)
    const drawn = int(rand, favorites7d, 400)
    // Os 9 primeiros de SEED_ENTRIES são os do Figma (offsets 0 a 8, antes de qualquer gerado).
    const favoritesTotal = index < FIGMA_NFTS.length ? Math.max(drawn, 150) : drawn
    stats[entry.nft.id] = { sales7d, favorites7d, favoritesTotal }
  })
  return stats
}

export const SEED_NFT_STATS: Readonly<Record<string, NftStats>> = buildSeedStats()
