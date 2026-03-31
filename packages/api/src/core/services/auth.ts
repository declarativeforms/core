import jwt from 'jsonwebtoken';
import { fetchGitHubUser, type GitHubUser } from '../gateways';

const AUTH_JWT_EXPIRY = '7d';

export type AuthTokenPayload = {
  github_id: number;
  login: string;
  name: string | null;
  avatar_url: string;
};

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
  };

  return jwt.sign(payload, secret, { expiresIn: AUTH_JWT_EXPIRY });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const secret = process.env.AUTH_JWT_SECRET;

  if (!secret) {
    return null;
  }

  try {
    const payload = jwt.verify(token, secret) as AuthTokenPayload;

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
  };
}
