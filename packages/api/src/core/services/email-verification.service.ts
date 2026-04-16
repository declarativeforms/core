import { createHash, randomBytes } from 'crypto';
import { faker } from '@faker-js/faker';
import type { EmailVerificationRepository } from '../repositories';

export class EmailVerificationService {
  constructor(
    private emailVerificationRepository: EmailVerificationRepository,
  ) {}

  private createSecretHash(email: string, salt: string, token: string): string {
    return createHash('sha256')
      .update([email, salt, token].join(':'))
      .digest('hex');
  }

  public async create(
    email: string,
    salt: string,
  ): Promise<{
    requestId: string;
    token: string;
  } | null> {
    const token = randomBytes(32).toString('hex');

    const now = new Date();

    const emailVerificationRecord =
      await this.emailVerificationRepository.insert({
        created_at: now.toISOString(),
        email,
        expires_at: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
        id: faker.string.alphanumeric({ casing: 'lower', length: 8 }),
        salt,
        hash: this.createSecretHash(email, salt, token),
      });

    return {
      requestId: emailVerificationRecord.id,
      token,
    };
  }

  public async verify(
    requestId: string,
    salt: string,
    token: string,
  ): Promise<string | null> {
    const emailVerificationRecord =
      await this.emailVerificationRepository.find(requestId);

    if (!emailVerificationRecord) {
      return null;
    }

    if (new Date(emailVerificationRecord.expires_at).getTime() < Date.now()) {
      return null;
    }

    if (emailVerificationRecord.salt !== salt) {
      return null;
    }

    if (
      this.createSecretHash(emailVerificationRecord.email, salt, token) !==
      emailVerificationRecord.hash
    ) {
      return null;
    }

    return emailVerificationRecord.email;
  }
}
