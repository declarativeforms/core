import jwt from 'jsonwebtoken';
import type { GitHubGateway } from '../gateways';
import type { User } from '../types';

const AUTH_JWT_EXPIRY = '7d';

export class AuthService {
  constructor(private gitHubGateway: GitHubGateway) {}

  public createStudioEmailUser(email: string): User {
    return {
      username: email,
    };
  }

  public issueToken(user: User): string {
    return jwt.sign(
      {
        sub: user.username,
        username: user.username,
      },
      process.env.AUTH_JWT_SECRET || '',
      { expiresIn: AUTH_JWT_EXPIRY },
    );
  }

  public issueTokenAndUser(user: User): { token: string; user: User } {
    return {
      token: this.issueToken(user),
      user,
    };
  }

  public findUserByToken(token: string): User | null {
    const secret = process.env.AUTH_JWT_SECRET;

    if (!secret) {
      return null;
    }

    try {
      const result = jwt.verify(token, secret) as jwt.JwtPayload;
      const username =
        typeof result.username === 'string'
          ? result.username
          : typeof result.sub === 'string'
            ? result.sub
            : '';

      if (!username) {
        return null;
      }

      return {
        username,
      };
    } catch {
      return null;
    }
  }

  async findTokenAndUserByGitHubCode(code: string): Promise<{
    token: string;
    user: User;
  } | null> {
    const accessToken = await this.gitHubGateway.findAccessToken(code);

    if (!accessToken) {
      return null;
    }

    const user = await this.gitHubGateway.findUser(accessToken);

    if (!user) {
      return null;
    }

    return this.issueTokenAndUser(user);
  }
}
