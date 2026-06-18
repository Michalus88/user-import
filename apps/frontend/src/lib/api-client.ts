const BASE_URL = '/api';

export interface ApiErrorBody extends Record<string, unknown> {
  statusCode?: number;
  code?: string;
  message?: string | string[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    const baseMessage = Array.isArray(body.message)
      ? body.message.join(', ')
      : body.message;
    super(baseMessage || `Request failed with status ${status}`);
    this.status = status;
    this.code = body.code;
    this.body = body;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  const hasBody = init?.body !== undefined && init.body !== null;
  const isFormData =
    typeof FormData !== 'undefined' && init?.body instanceof FormData;
  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (!response.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // non-json error body
    }
    throw new ApiError(response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
