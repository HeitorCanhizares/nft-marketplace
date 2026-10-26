import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import type { z } from 'zod'
import { ApiError } from './ApiError'
import { http } from './client'

const MAX_ISSUES = 5

type Schema = z.ZodType | null

type Body<S extends Schema> = S extends z.ZodType ? z.output<S> : undefined

type ValidationIssue = { path: string; message: string }

function invalidResponse(issues: ValidationIssue[]): never {
  throw new ApiError({
    status: 200,
    code: 'INVALID_RESPONSE',
    message: 'Resposta inesperada do servidor.',
    details: { issues },
  })
}

export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (result.success) return result.data

  const issues = result.error.issues.slice(0, MAX_ISSUES).map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }))

  if (import.meta.env.MODE !== 'test') {
    console.error('Resposta da API fora do contrato:', issues)
  }

  return invalidResponse(issues)
}

function parseResponse(schema: Schema, response: AxiosResponse<unknown>): unknown {
  if (schema === null) {
    if (response.status === 204) return undefined
    return invalidResponse([{ path: '', message: 'Resposta com corpo era esperada sem corpo.' }])
  }

  return validate(schema, response.data)
}

async function request<S extends Schema>(
  pending: Promise<AxiosResponse<unknown>>,
  schema: S,
): Promise<Body<S>> {
  const response = await pending
  return parseResponse(schema, response) as Body<S>
}

export function get<S extends Schema>(
  url: string,
  schema: S,
  config?: AxiosRequestConfig,
): Promise<Body<S>> {
  return request(http.get<unknown>(url, config), schema)
}

export function post<S extends Schema>(
  url: string,
  schema: S,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<Body<S>> {
  return request(http.post<unknown>(url, body, config), schema)
}

export function put<S extends Schema>(
  url: string,
  schema: S,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<Body<S>> {
  return request(http.put<unknown>(url, body, config), schema)
}

export function patch<S extends Schema>(
  url: string,
  schema: S,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<Body<S>> {
  return request(http.patch<unknown>(url, body, config), schema)
}

export function del<S extends Schema>(
  url: string,
  schema: S,
  config?: AxiosRequestConfig,
): Promise<Body<S>> {
  return request(http.delete<unknown>(url, config), schema)
}
