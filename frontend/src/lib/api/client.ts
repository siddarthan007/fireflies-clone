export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// FastAPI sends {"detail": "message"}, or a list of field errors for a malformed body.
async function errorMessage(response: Response): Promise<string> {
  const body = await response.json().catch(() => null)
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  return response.statusText || 'Something went wrong'
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  json?: unknown
  form?: FormData
}

export async function api<T>(path: string, { method = 'GET', json, form }: RequestOptions = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: json === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: form ?? (json === undefined ? undefined : JSON.stringify(json)),
  })
  if (!response.ok) throw new ApiError(response.status, await errorMessage(response))
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

// POSTs and yields the response text as it arrives, for answers that stream.
export async function* streamText(
  path: string,
  json: unknown,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json),
    signal,
  })
  if (!response.ok || !response.body)
    throw new ApiError(response.status, await errorMessage(response))

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) return
      yield value
    }
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

// Builds "?a=1&tag=x&tag=y". Arrays repeat the key, empty values are left out.
export function queryString(params: Record<string, string | number | string[] | undefined>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined && item !== '') query.append(key, String(item))
    }
  }
  const text = query.toString()
  return text ? `?${text}` : ''
}
