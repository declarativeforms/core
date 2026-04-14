import { createHash, randomBytes } from 'crypto';
import { faker } from '@faker-js/faker';
import type { StudioMagicLinkRepository } from '../repositories';

const MAGIC_LINK_EXPIRY_MS = 10 * 60 * 1000;

export class StudioMagicLinkService {
  constructor(private studioMagicLinkRepository: StudioMagicLinkRepository) {}

  public async create(email: string): Promise<{
    requestId: string;
    token: string;
  } | null> {
    const token = randomBytes(32).toString('hex');

    const now = new Date();

    const studioMagicLinkRecord = await this.studioMagicLinkRepository.insert({
      created_at: now.toISOString(),
      email,
      expires_at: new Date(now.getTime() + MAGIC_LINK_EXPIRY_MS).toISOString(),
      id: faker.string.alphanumeric({ casing: 'lower', length: 8 }),
      secret_hash: createHash('sha256').update(token).digest('hex'),
    });

    return {
      requestId: studioMagicLinkRecord.id,
      token,
    };
  }

  public async verify(input: {
    requestId: string;
    token: string;
  }): Promise<string | null> {
    const studioMagicLinkRecord = await this.studioMagicLinkRepository.find(
      input.requestId,
    );

    if (!studioMagicLinkRecord) {
      return null;
    }

    if (new Date(studioMagicLinkRecord.expires_at).getTime() < Date.now()) {
      return null;
    }

    if (
      createHash('sha256').update(input.token).digest('hex') !==
      studioMagicLinkRecord.secret_hash
    ) {
      return null;
    }

    return studioMagicLinkRecord.email;
  }
}
