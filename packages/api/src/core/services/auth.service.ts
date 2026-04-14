import jwt from 'jsonwebtoken';
import type { User } from '../types';

export class AuthService {
  constructor() {}

  public sign(user: User): string {
    return jwt.sign(
      {
        sub: user.username,
        username: user.username,
      },
      process.env.AUTH_JWT_SECRET || '',
      { expiresIn: '7d' },
    );
  }

  public verify(token: string): User | null {
    try {
      const result = jwt.verify(
        token,
        process.env.AUTH_JWT_SECRET || '',
      ) as jwt.JwtPayload;

      return {
        username: result.sub || '',
      };
    } catch {
      return null;
    }
  }
}
