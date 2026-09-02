const TOKEN_KEY = 'declarativeforms.studio.access_token';
const EXPIRES_KEY = 'declarativeforms.studio.expires_at';
const REAUTH_KEY = 'declarativeforms.studio.reauth_at';
const REAUTH_COOLDOWN_MS = 30_000;
const EXPIRY_MARGIN_MS = 120_000;

export type SignedOutReason = 'expired' | 'initial' | 'signed-out';

export type AuthSnapshot = {
  accessToken: string | null;
  expiresAt: number | null;
  reason: SignedOutReason;
};

const listeners = new Set<() => void>();
let snapshot: AuthSnapshot = read('initial');

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) {
      window.localStorage.removeItem(key);

      return;
    }

    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function read(reason: SignedOutReason): AuthSnapshot {
  const token = readStorage(TOKEN_KEY);
  const expires = readStorage(EXPIRES_KEY);
  const expiresAt = expires ? Number.parseInt(expires, 10) : null;

  return {
    accessToken: token,
    expiresAt:
      expiresAt !== null && Number.isFinite(expiresAt) ? expiresAt : null,
    reason,
  };
}

function publish(next: AuthSnapshot): void {
  snapshot = next;

  for (const listener of listeners) {
    listener();
  }
}

export function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function readAuth(): AuthSnapshot {
  return snapshot;
}

export function readAccessToken(): string | null {
  return snapshot.accessToken;
}

export function setAccessToken(token: string, expiresIn: number): void {
  const expiresAt = Date.now() + expiresIn * 1000;
  writeStorage(TOKEN_KEY, token);
  writeStorage(EXPIRES_KEY, String(expiresAt));
  publish({ accessToken: token, expiresAt, reason: 'initial' });
}

export function clearAccessToken(reason: SignedOutReason): void {
  writeStorage(TOKEN_KEY, null);
  writeStorage(EXPIRES_KEY, null);
  publish({ accessToken: null, expiresAt: null, reason });
}

export function isExpiringSoon(): boolean {
  if (snapshot.expiresAt === null) {
    return false;
  }

  return snapshot.expiresAt - Date.now() < EXPIRY_MARGIN_MS;
}

export function canReauthorize(): boolean {
  try {
    const last = window.sessionStorage.getItem(REAUTH_KEY);

    if (!last) {
      return true;
    }

    return Date.now() - Number.parseInt(last, 10) > REAUTH_COOLDOWN_MS;
  } catch {
    return true;
  }
}

export function markReauthorized(): void {
  try {
    window.sessionStorage.setItem(REAUTH_KEY, String(Date.now()));
  } catch {
    return;
  }
}

export function watchAuthStorage(): void {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key !== TOKEN_KEY && event.key !== null) {
      return;
    }

    publish(read(readStorage(TOKEN_KEY) ? 'initial' : 'signed-out'));
  });
}
