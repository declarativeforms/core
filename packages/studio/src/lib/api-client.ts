import { clearAccessToken, readAccessToken } from '@/lib/auth-store';

const DEFAULT_TIMEOUT_MS = 20_000;

export type ApiMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST';

export type ApiRequestOptions = {
  method: ApiMethod;
  path: string;
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
};

async function send(
  options: ApiRequestOptions,
  withBearer: boolean,
): Promise<unknown> {
  const headers = new Headers();

  if (options.body !== undefined) {
    headers.set('content-type', 'application/json');
  }

  if (withBearer) {
    const token = readAccessToken();

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
  }

  const timeout = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const signal = options.signal
    ? AbortSignal.any([timeout, options.signal])
    : timeout;
  let response: Response;

  try {
    response = await fetch(`/api/v1/${options.path}`, {
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      headers,
      method: options.method,
      signal,
    });
  } catch {
    throw new Error('Request failed');
  }

  if (response.status === 401 && withBearer) {
    clearAccessToken('expired');
  }

  if (!response.ok) {
    throw new Error('Request failed');
  }

  const text = await response.text();

  return text ? JSON.parse(text) : null;
}

export async function apiRequest<T>(options: ApiRequestOptions): Promise<T> {
  return (await send(options, true)) as T;
}

export async function apiPublicRequest<T>(
  options: ApiRequestOptions,
): Promise<T> {
  return (await send(options, false)) as T;
}
