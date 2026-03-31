import { createHmac } from 'crypto';
import { fetchGitHubUser, type GitHubUser } from '../gateways';

const AUTH_JWT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type AuthTokenPayload = {
  github_id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  exp: number;
};

function base64url(data: Buffer | string): string {
  const buf = typeof data === 'string' ? Buffer.from(data) : data;
  return buf.toString('base64url');
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_JWT_SECRET;

  if (!secret) {
    throw new Error('AUTH_JWT_SECRET is not configured');
  }

  return secret;
}

export function createAuthToken(user: GitHubUser): string {
  const secret = getAuthSecret();

  const payload: AuthTokenPayload = {
    github_id: user.id,
    login: user.login,
    name: user.name,
    avatar_url: user.avatar_url,
    exp: Date.now() + AUTH_JWT_EXPIRY_MS,
  };

  const encodedPayload = base64url(JSON.stringify(payload));

  const signature = base64url(
    createHmac('sha256', secret).update(encodedPayload).digest(),
  );

  return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const secret = process.env.AUTH_JWT_SECRET;

  if (!secret) {
    return null;
  }

  const parts = token.split('.');

  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, signature] = parts;

  const expectedSignature = base64url(
    createHmac('sha256', secret).update(encodedPayload).digest(),
  );

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload: AuthTokenPayload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString(),
    );

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function authenticateWithGitHub(
  code: string,
): Promise<{ token: string; user: GitHubUser } | null> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data: any = await response.json();

  const accessToken = data.access_token;

  if (!accessToken) {
    return null;
  }

  const user = await fetchGitHubUser(accessToken);

  if (!user) {
    return null;
  }

  const token = createAuthToken(user);

  return { token, user };
}

export async function resolveAuthUser(
  authorization: string | undefined,
): Promise<AuthTokenPayload | null> {
  if (!authorization) {
    return null;
  }

  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : authorization;

  if (!token) {
    return null;
  }

  // Try JWT verification first
  const jwtPayload = verifyAuthToken(token);

  if (jwtPayload) {
    return jwtPayload;
  }

  // Fall back to GitHub access token
  const user = await fetchGitHubUser(token);

  if (!user) {
    return null;
  }

  return {
    github_id: user.id,
    login: user.login,
    name: user.name,
    avatar_url: user.avatar_url,
    exp: Date.now() + AUTH_JWT_EXPIRY_MS,
  };
}
