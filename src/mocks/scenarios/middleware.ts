import type { DefaultBodyType, HttpResponse, HttpResponseResolver, PathParams } from 'msw'
import { hasScenario, routeScenario } from './active'
import { mockConfig } from './config'
import { apiError, networkError, randomServerError } from './errors'
import { pickLatencyMs, wait } from './latency'

export type MockRouteOptions = {
  protected?: boolean
  exemptFromRandomFailures?: boolean
}

function chance(rate: number): boolean {
  return rate > 0 && Math.random() < rate
}

// Os erros do mock são `Response` comuns; o resolver tipado do msw exige `HttpResponse<T>`.
function asMockResponse(response: Response): HttpResponse<DefaultBodyType> {
  return response as HttpResponse<DefaultBodyType>
}

// `routeKey` no formato `MÉTODO /caminho`, sem o prefixo da API (ex.: `GET /nfts`).
export function withMock<
  Params extends PathParams<keyof Params> = PathParams,
  RequestBodyType extends DefaultBodyType = DefaultBodyType,
>(
  routeKey: string,
  resolver: HttpResponseResolver<Params, RequestBodyType>,
  options: MockRouteOptions = {},
): HttpResponseResolver<Params, RequestBodyType> {
  return async (info) => {
    await wait(pickLatencyMs())

    if (hasScenario('offline') || routeScenario('network-error', routeKey)) {
      return asMockResponse(networkError())
    }

    if (!options.exemptFromRandomFailures) {
      if (chance(mockConfig.networkErrorRate)) return asMockResponse(networkError())
      if (chance(mockConfig.errorRate)) return asMockResponse(randomServerError())
    }

    if (routeScenario('server-error', routeKey)) {
      return asMockResponse(apiError('INTERNAL_ERROR'))
    }
    if (routeScenario('unavailable', routeKey)) {
      return asMockResponse(apiError('SERVICE_UNAVAILABLE'))
    }
    if (routeScenario('not-found', routeKey)) {
      return asMockResponse(apiError('NOT_FOUND'))
    }

    // Só o cenário forçado; a checagem real do token fica em cada handler de fluxo.
    if (options.protected && hasScenario('session-expired')) {
      return asMockResponse(apiError('SESSION_EXPIRED'))
    }

    if (routeScenario('validation-error', routeKey)) {
      return asMockResponse(apiError('VALIDATION_ERROR', { fields: { field: 'Valor inválido.' } }))
    }

    return resolver(info)
  }
}
