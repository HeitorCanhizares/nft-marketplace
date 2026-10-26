import { http, HttpResponse } from 'msw'

import { availabilityBodySchema } from '../../schemas/auth'
import { usersStore } from '../db/stores'
import { apiPath } from '../scenarios/config'
import { apiError, validationError } from '../scenarios/errors'
import { withMock } from '../scenarios/middleware'

export const authHandlers = [
  http.post(
    apiPath('/auth/availability'),
    withMock('POST /auth/availability', async ({ request }) => {
      const body: unknown = await request.json().catch(() => null)
      if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return apiError('BAD_REQUEST')
      }

      const parsed = availabilityBodySchema.safeParse(body)
      if (!parsed.success) return validationError(parsed.error)

      // E-mail e usuário são únicos sem diferenciar maiúsculas.
      const users = await usersStore.getAll()
      const data = parsed.data
      const taken =
        'email' in data
          ? users.some((user) => user.email.toLowerCase() === data.email.toLowerCase())
          : users.some((user) => user.username.toLowerCase() === data.username.toLowerCase())

      return HttpResponse.json({ available: !taken })
    }),
  ),
]
