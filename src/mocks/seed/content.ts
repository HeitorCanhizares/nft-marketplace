import type { NftDetail, Post, Promo, Review } from '@/types/nft'
import { SEED_IMAGE_URLS, SEED_NFT_CREATED_AT } from './nfts'

// Mesma data de referência do seed de NFTs: as avaliações vão da criação do NFT até aqui.
const REFERENCE_MS = Date.UTC(2026, 9, 25, 12, 0, 0)

// Índices em SEED_IMAGE_URLS (ordem de BASE_IMAGES em nfts.ts).
const IMG_APE_JACKET = 0
const IMG_APE_HEADPHONES = 1
const IMG_GORILLA_HOODIE = 2
const IMG_GORILLA_BLAZER = 3

export const SEED_POSTS: readonly Post[] = [
  {
    id: 'propriedade-de-nfts',
    date: '12 de setembro',
    readingMinutes: 6,
    title: 'Como funciona a propriedade de NFTs',
    summary: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: {
      src: SEED_IMAGE_URLS[IMG_GORILLA_BLAZER],
      alt: 'Gorila preto de blazer bege e gola verde',
    },
  },
  {
    id: 'artistas-digitais',
    date: '13 de setembro',
    readingMinutes: 2,
    title: '10 artistas digitais para acompanhar',
    summary: 'Conheça criadores que moldam a cultura digital.',
    image: {
      src: SEED_IMAGE_URLS[IMG_APE_JACKET],
      alt: 'Macaco de óculos escuros e jaqueta verde',
    },
  },
  {
    id: 'raridade-atributos-procedencia',
    date: '15 de setembro',
    readingMinutes: 3,
    title: 'Raridade, atributos e procedência',
    summary: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: {
      src: SEED_IMAGE_URLS[IMG_GORILLA_HOODIE],
      alt: 'Gorila cinza de capuz roxo e chapéu verde',
    },
  },
  {
    id: 'proteger-carteira',
    date: '15 de setembro',
    readingMinutes: 2,
    title: 'Como proteger sua carteira',
    summary: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: {
      src: SEED_IMAGE_URLS[IMG_APE_HEADPHONES],
      alt: 'Macaco laranja com fones de ouvido verdes',
    },
  },
]

export const SEED_PROMOS: readonly Promo[] = [
  {
    id: 'lancamentos-genesis',
    title: 'Lançamentos gênesis de edição limitada',
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    ctaLabel: 'Explorar',
    image: {
      src: SEED_IMAGE_URLS[IMG_APE_JACKET],
      alt: 'Macaco de óculos escuros e jaqueta verde',
    },
    query: { tab: 'new' },
  },
  {
    id: 'arte-digital-selecionada',
    title: 'Arte digital selecionada e muito mais',
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura digital.',
    ctaLabel: 'Explorar',
    image: {
      src: SEED_IMAGE_URLS[IMG_GORILLA_BLAZER],
      alt: 'Gorila preto de blazer bege e gola verde',
    },
    query: { collection: 'arte-digital' },
  },
]

const AUTHORS: readonly string[] = [
  'Lívia Antunes',
  'Rafael Teixeira',
  'Bianca Moraes',
  'Gustavo Lima',
  'Helena Prado',
  'Caio Ribeiro',
  'Yasmin Corrêa',
  'Thiago Rocha',
  'Manuela Dias',
  'Felipe Nogueira',
]

// Textos curtos por nota (1 a 5). Cada nota tem variações escolhidas de forma determinística.
const BODIES: Record<Review['rating'], readonly string[]> = {
  1: ['Não atendeu minhas expectativas.', 'Arte bem abaixo do esperado para o preço.'],
  2: ['Achei simples demais para o valor pago.', 'Entrega demorou e a arte é mediana.'],
  3: ['Bom visual, mas poderia ter mais detalhes.', 'Cumpre o que promete, nada além disso.'],
  4: ['Arte bonita e entrega dentro do prazo.', 'Gostei da qualidade e dos atributos.'],
  5: ['Arte impecável, recomendo a todos.', 'Peça de coleção de verdade, adorei.'],
}

// Para `count` notas de 1 a 5 que somem S, a média é S / count. Retorna a menor soma cuja
// média arredondada a 1 casa é `average`; a existência é garantida pelo seed (02-014).
function findSum(count: number, average: number): number {
  const target = average.toFixed(1)
  for (let sum = count; sum <= 5 * count; sum++) {
    if ((sum / count).toFixed(1) === target) return sum
  }
  throw new Error(`Média ${average} inalcançável com ${count} notas inteiras`)
}

// Divide a soma em `count` notas inteiras de 1 a 5, o mais uniformes possível.
function splitRatings(count: number, sum: number): Review['rating'][] {
  const base = Math.floor(sum / count)
  const extra = sum - base * count
  const ratings: Review['rating'][] = []
  for (let i = 0; i < count; i++) {
    ratings.push((i < extra ? base + 1 : base) as Review['rating'])
  }
  return ratings
}

export function buildSeedReviews(nfts: NftDetail[]): Review[] {
  return nfts.flatMap((nft, nftIndex) => {
    const { average, count } = nft.rating
    if (count === 0) return []

    const createdMs = Date.parse(SEED_NFT_CREATED_AT[nft.id])
    const ratings = splitRatings(count, findSum(count, average))
    // Rotaciona a ordem das notas pelo índice do NFT para não repetir o mesmo padrão em todo lugar.
    const shift = nftIndex % count
    const ordered = [...ratings.slice(shift), ...ratings.slice(0, shift)]

    return ordered.map((rating, k) => {
      const bodies = BODIES[rating]
      const author = AUTHORS[(nftIndex + k) % AUTHORS.length]
      // Avaliações espalhadas entre a criação do NFT e a data de referência.
      const createdAt = new Date(createdMs + ((k + 1) / (count + 1)) * (REFERENCE_MS - createdMs))
      return {
        id: `${nft.id}-review-${k + 1}`,
        nftId: nft.id,
        author,
        rating,
        body: bodies[(nftIndex + k) % bodies.length],
        createdAt: createdAt.toISOString(),
      }
    })
  })
}
