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
    fieldId: string,
    useOneTimePin = false,
    formId = '',
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
        attempts: 0,
        created_at: now.toISOString(),
        email: email.trim().toLowerCase(),
        expires_at: new Date(now.getTime() + 10 * 60 * 1000),
        field_id: fieldId,
        form_id: formId,
        hash: this.createHash(email.trim().toLowerCase(), fieldId, token),
        id: randomBytes(6).toString('hex'),
        salt: fieldId,
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

    const attempts =
      await this.emailVerificationRepository.incrementAttempts(requestId);
    if (attempts > 5) {
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

    await this.emailVerificationRepository.delete(requestId);
    return emailVerification.email;
  }
}
