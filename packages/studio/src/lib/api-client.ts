import { clearAccessToken, readAccessToken } from '@/lib/auth-store';

const DEFAULT_TIMEOUT_MS = 20_000;

export type ApiMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

export type ApiRequestOptions = {
  method: ApiMethod;
  path: string;
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
};

export type ApiFailure = Error & {
  status: number;
  errorCode: string | null;
  fieldErrors: Record<string, string> | null;
  revision: number | null;
  generationId: string | null;
  messageId: string | null;
};

export function isApiFailure(error: unknown): error is ApiFailure {
  return (
    error instanceof Error &&
    typeof (error as Partial<ApiFailure>).status === 'number'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readString(
  source: Record<string, unknown>,
  key: string,
): string | null {
  const value = source[key];

  return typeof value === 'string' ? value : null;
}

function readNumber(
  source: Record<string, unknown>,
  key: string,
): number | null {
  const value = source[key];

  return typeof value === 'number' ? value : null;
}

function readErrorMap(
  source: Record<string, unknown>,
): Record<string, string> | null {
  const value = source.errors;

  if (!isRecord(value)) {
    return null;
  }

  const result: Record<string, string> = {};

  for (const key of Object.keys(value)) {
    const entry = value[key];

    if (typeof entry === 'string') {
      result[key] = entry;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

function buildFailure(status: number, body: unknown): ApiFailure {
  const source = isRecord(body) ? body : {};
  const errorCode = readString(source, 'error');
  const fieldErrors = readErrorMap(source);
  const message =
    errorCode ?? fieldErrors?.['/'] ?? `Request failed with status ${status}`;

  return Object.assign(new Error(message), {
    errorCode,
    fieldErrors,
    generationId: readString(source, 'generation_id'),
    messageId: readString(source, 'message_id'),
    revision: readNumber(source, 'revision'),
    status,
  });
}

function buildTransportFailure(errorCode: string): ApiFailure {
  return Object.assign(new Error(errorCode), {
    errorCode,
    fieldErrors: null,
    generationId: null,
    messageId: null,
    revision: null,
    status: 0,
  });
}

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
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw buildTransportFailure('timeout');
    }

    throw buildTransportFailure('network');
  }

  const text = await response.text();
  let parsed: unknown = null;

  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (response.status === 401 && withBearer) {
    clearAccessToken('expired');
  }

  if (!response.ok) {
    throw buildFailure(response.status, parsed);
  }

  return parsed;
}

export async function apiRequest<T>(options: ApiRequestOptions): Promise<T> {
  return (await send(options, true)) as T;
}

export async function apiPublicRequest<T>(
  options: ApiRequestOptions,
): Promise<T> {
  return (await send(options, false)) as T;
}
