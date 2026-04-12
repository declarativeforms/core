import jwt from 'jsonwebtoken';
import { fetchGitHubUser } from '../gateways';

const AUTH_JWT_EXPIRY = '7d';

export type AuthUser = {
  github_id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
};

export function decodeToken(token: string): (jwt.JwtPayload & AuthUser) | null {
  const secret = process.env.AUTH_JWT_SECRET;

  if (!secret) {
    return null;
  }

  try {
    return jwt.verify(token, secret) as jwt.JwtPayload & AuthUser;
  } catch {
    return null;
  }
}

export async function findTokenAndUserByCode(
  code: string,
): Promise<{ token: string; user: Awaited<ReturnType<typeof fetchGitHubUser>> & {} } | null> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.STUDIO_GITHUB_CLIENT_ID,
      client_secret: process.env.STUDIO_GITHUB_CLIENT_SECRET,
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

  const secret = process.env.AUTH_JWT_SECRET;

  if (!secret) {
    throw new Error('AUTH_JWT_SECRET is not configured');
  }

  const token = jwt.sign(
    {
      github_id: user.id,
      login: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
      email: user.email,
    } satisfies AuthUser,
    secret,
    { expiresIn: AUTH_JWT_EXPIRY },
  );

  return { token, user };
}

export async function findUserByToken(token: string): Promise<AuthUser | null> {
  const jwtPayload = decodeToken(token);

  if (jwtPayload) {
    return jwtPayload;
  }

  const user = await fetchGitHubUser(token);

  if (!user) {
    return null;
  }

  return {
    github_id: user.id,
    login: user.login,
    name: user.name,
    avatar_url: user.avatar_url,
    email: user.email,
  };
}
