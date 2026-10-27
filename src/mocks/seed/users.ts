import type { UserRecord, WalletRecord } from '../db/db'

// Hashes pré-calculados com os mesmos parâmetros de src/mocks/db/password.ts
// (PBKDF2-SHA-256, 100.000 iterações, salt de 16 bytes, 256 bits).
export const seedUsers: readonly UserRecord[] = [
  {
    id: 'user-teste',
    displayName: 'Teste Kurio',
    username: 'teste',
    email: 'teste@kurio.test',
    passwordSalt: 'sCYbsgflJ88bXPwMUm1ngw==',
    passwordHash: 'htHTcX8WquD79Zwe6jWoGFiYMO8uwL9aER7AK5poAMw=',
  },
  {
    id: 'user-outro',
    displayName: 'Outro Kurio',
    username: 'outro',
    email: 'outro@kurio.test',
    passwordSalt: 'iT/DQFKEprJtFifGGX0rgA==',
    passwordHash: '7ys/7qWt+0d/eUgi61ihUOjMaTwECR6SFZalYjQILBI=',
  },
]

// Só o usuário de teste tem carteira: a principal. Nenhuma secundária.
export const seedWallets: readonly WalletRecord[] = [
  {
    id: 'wallet-primary-teste',
    userId: 'user-teste',
    slot: 'primary',
    displayName: 'Carteira principal',
    username: 'teste',
    nickname: 'Carteira de teste',
    profileName: 'Teste Kurio',
    network: 'ethereum',
    address: '0xA91F3D7B9C1E0A5F48B2C6D09E17A3F5B8C4E82C',
    provider: 'metamask',
    referralCode: 'KURIOTESTE',
    email: 'teste@kurio.test',
    ensName: 'nova-kurio.eth',
  },
]
