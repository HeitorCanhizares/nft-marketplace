import { http, HttpResponse } from 'msw'

import { walletBodySchema } from '../../schemas/wallet'
import type { WalletRecord } from '../db/db'
import { walletsStore } from '../db/stores'
import { apiPath } from '../scenarios/config'
import { apiError, validationError } from '../scenarios/errors'
import { withMock } from '../scenarios/middleware'
import { authenticate } from './sessionGuard'
import type { Wallet } from '../../types/user'

type Slot = Wallet['slot']

// Nunca devolve userId.
function toWallet(record: WalletRecord): Wallet {
  return {
    id: record.id,
    slot: record.slot,
    displayName: record.displayName,
    username: record.username,
    nickname: record.nickname,
    profileName: record.profileName,
    network: record.network,
    address: record.address,
    ...(record.secondaryAddressOrEns === undefined
      ? {}
      : { secondaryAddressOrEns: record.secondaryAddressOrEns }),
    provider: record.provider,
    referralCode: record.referralCode,
    email: record.email,
    ensName: record.ensName,
  }
}

function findBySlot(records: WalletRecord[], slot: Slot): WalletRecord | undefined {
  return records.find((record) => record.slot === slot)
}

async function saveSlot(request: Request, userId: string, slot: Slot): Promise<Response> {
  const body: unknown = await request.json().catch(() => null)
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return apiError('BAD_REQUEST')
  }

  const parsed = walletBodySchema.safeParse(body)
  if (!parsed.success) return validationError(parsed.error)

  // Salvar de novo no mesmo slot mantém o id: nunca cria um segundo registro no slot.
  const existing = findBySlot(await walletsStore.getByUserId(userId), slot)
  const record: WalletRecord = {
    ...parsed.data,
    id: existing?.id ?? `wallet-${slot}-${userId}-${Date.now()}`,
    slot,
    userId,
  }
  await walletsStore.put(record)

  return HttpResponse.json(toWallet(record))
}

export const walletsHandlers = [
  http.get(
    apiPath('/wallets'),
    withMock(
      'GET /wallets',
      async ({ request }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        const records = await walletsStore.getByUserId(auth.user.id)
        const primary = findBySlot(records, 'primary')
        const secondary = findBySlot(records, 'secondary')

        return HttpResponse.json({
          primary: primary ? toWallet(primary) : null,
          secondary: secondary ? toWallet(secondary) : null,
        })
      },
      { protected: true },
    ),
  ),
  http.put(
    apiPath('/wallets/primary'),
    withMock(
      'PUT /wallets/primary',
      async ({ request }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        return saveSlot(request, auth.user.id, 'primary')
      },
      { protected: true },
    ),
  ),
  http.put(
    apiPath('/wallets/secondary'),
    withMock(
      'PUT /wallets/secondary',
      async ({ request }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        return saveSlot(request, auth.user.id, 'secondary')
      },
      { protected: true },
    ),
  ),
  http.delete(
    apiPath('/wallets/secondary'),
    withMock(
      'DELETE /wallets/secondary',
      async ({ request }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        const secondary = findBySlot(await walletsStore.getByUserId(auth.user.id), 'secondary')
        if (!secondary) return apiError('NOT_FOUND')

        await walletsStore.delete(secondary.id)
        return new HttpResponse(null, { status: 204 })
      },
      { protected: true },
    ),
  ),
  http.post(
    apiPath('/wallets/swap'),
    withMock(
      'POST /wallets/swap',
      async ({ request }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        const records = await walletsStore.getByUserId(auth.user.id)
        const primary = findBySlot(records, 'primary')
        const secondary = findBySlot(records, 'secondary')
        if (!primary || !secondary) return apiError('NOT_FOUND')

        // Troca só o slot: os ids permanecem.
        const nextPrimary: WalletRecord = { ...secondary, slot: 'primary' }
        const nextSecondary: WalletRecord = { ...primary, slot: 'secondary' }
        await walletsStore.put(nextPrimary)
        await walletsStore.put(nextSecondary)

        return HttpResponse.json({
          primary: toWallet(nextPrimary),
          secondary: toWallet(nextSecondary),
        })
      },
      { protected: true },
    ),
  ),
]
