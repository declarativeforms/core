import jwt from 'jsonwebtoken';
import type { GitHubGateway } from '../gateways';
import type { User } from '../types';

const AUTH_JWT_EXPIRY = '7d';

export class AuthService {
  constructor(private gitHubGateway: GitHubGateway) {}

  public createStudioEmailUser(email: string): User {
    return {
      avatar_url: '',
      github_id: 0,
      id: 0,
      login: email,
      name: null,
    };
  }

  public issueToken(user: User): string {
    return jwt.sign(
      {
        avatar_url: user.avatar_url,
        github_id: user.github_id,
        id: user.id,
        login: user.login,
        name: user.name,
        sub: user.login,
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

      return {
        avatar_url:
          typeof result.avatar_url === 'string' ? result.avatar_url : '',
        github_id:
          typeof result.github_id === 'number' ? result.github_id : 0,
        id: typeof result.id === 'number' ? result.id : 0,
        login:
          typeof result.login === 'string'
            ? result.login
            : typeof result.sub === 'string'
              ? result.sub
              : '',
        name: typeof result.name === 'string' ? result.name : null,
      };
    } catch {
      return null;
    }
  }

  async findTokenAndUserByGitHubCode(code: string): Promise<{
    token: string;
    user: User;
  } | null> {
    const accessToken = await this.gitHubGateway.findAccessToken(
      code,
      process.env.STUDIO_GITHUB_CLIENT_ID as string,
      process.env.STUDIO_GITHUB_CLIENT_SECRET as string,
    );

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
