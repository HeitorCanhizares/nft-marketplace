export type SeedCollection = {
  id: string
  name: string
  // Contagem alvo de NFTs (soma 283). Usada pelo seed de NFTs (02-014).
  targetCount: number
}

export const seedCollections: readonly SeedCollection[] = [
  { id: 'arte-digital', name: 'Arte digital', targetCount: 39 },
  { id: 'fotografia', name: 'Fotografia', targetCount: 14 },
  { id: 'musica', name: 'Música', targetCount: 77 },
  { id: 'arte-3d', name: 'Arte 3D', targetCount: 46 },
  { id: 'colecionaveis', name: 'Colecionáveis', targetCount: 27 },
  { id: 'generativa', name: 'Generativa', targetCount: 20 },
  { id: 'jogos', name: 'Jogos', targetCount: 23 },
  { id: 'assinaturas', name: 'Assinaturas', targetCount: 16 },
  { id: 'utilidade', name: 'Utilidade', targetCount: 21 },
]
