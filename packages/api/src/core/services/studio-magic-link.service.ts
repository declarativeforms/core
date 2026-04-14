import { createHash, randomBytes } from 'crypto';
import { faker } from '@faker-js/faker';
import type { StudioMagicLinkRepository } from '../repositories';
import type { IStudioMagicLinkRecord } from '../types';

const MAGIC_LINK_EXPIRY_MS = 10 * 60 * 1000;
const MAGIC_LINK_RESEND_COOLDOWN_MS = 30 * 1000;

export class StudioMagicLinkService {
  constructor(
    private studioMagicLinkRepository: StudioMagicLinkRepository,
  ) {}

  public async createRequest(input: {
    email: string;
  }): Promise<{ requestId: string; resendAfterSeconds: number; token: string } | null> {
    const recent = await this.studioMagicLinkRepository.findMostRecent(input.email);

    if (recent) {
      const elapsed = Date.now() - new Date(recent.created_at).getTime();

      if (elapsed < MAGIC_LINK_RESEND_COOLDOWN_MS) {
        return null;
      }
    }

    const token = randomBytes(32).toString('hex');
    const now = new Date();
    const record: IStudioMagicLinkRecord = {
      created_at: now.toISOString(),
      email: input.email,
      expires_at: new Date(now.getTime() + MAGIC_LINK_EXPIRY_MS).toISOString(),
      id: faker.string.alphanumeric({ casing: 'lower', length: 8 }),
      secret_hash: createHash('sha256').update(token).digest('hex'),
    };

    await this.studioMagicLinkRepository.insert(record);

    return {
      requestId: record.id,
      resendAfterSeconds: MAGIC_LINK_RESEND_COOLDOWN_MS / 1000,
      token,
    };
  }

  public async verifyToken(input: {
    requestId: string;
    token: string;
  }): Promise<string | null> {
    const record = await this.studioMagicLinkRepository.find(input.requestId);

    if (!record) {
      return null;
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return null;
    }

    const submittedHash = createHash('sha256')
      .update(input.token)
      .digest('hex');

    if (submittedHash !== record.secret_hash) {
      return null;
    }

    return record.email;
  }
}
