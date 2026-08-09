import { createHash, randomBytes, randomInt } from 'crypto';
import type { EmailVerificationRepository } from '../repositories';

export class EmailVerificationService {
  constructor(
    private emailVerificationRepository: EmailVerificationRepository,
  ) {}

  private createHash(email: string, salt: string, token: string): string {
    return createHash('sha256')
      .update([email, salt, token].join(':'))
      .digest('hex');
  }

  public async create(
    email: string,
    salt: string,
    useOneTimePin = false,
  ): Promise<{
    requestId: string;
    token: string;
  }> {
    const token = useOneTimePin
      ? randomInt(100000, 1000000).toString()
      : randomBytes(32).toString('hex');

    const now = new Date();

    const emailVerificationRecord =
      await this.emailVerificationRepository.insert({
        created_at: now.toISOString(),
        email,
        expires_at: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
        hash: this.createHash(email, salt, token),
        id: randomBytes(4).toString('hex'),
        salt,
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
    const emailVerification =
      await this.emailVerificationRepository.find(requestId);

    if (!emailVerification) {
      return null;
    }

    if (new Date(emailVerification.expires_at).getTime() < Date.now()) {
      return null;
    }

    if (emailVerification.salt !== salt) {
      return null;
    }

    if (
      this.createHash(emailVerification.email, salt, token) !==
      emailVerification.hash
    ) {
      return null;
    }

    return emailVerification.email;
  }
}
