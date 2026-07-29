import type { IEmailVerification } from '../types';
import type { EmailVerificationRepository } from '../repositories';
import { EmailVerificationService } from './email-verification.service';

function createRepository() {
  let record: IEmailVerification | null = null;
  return {
    repository: {
      delete: async () => {
        record = null;
      },
      find: async () => record,
      incrementAttempts: async () => {
        if (!record) return Number.MAX_SAFE_INTEGER;
        record.attempts += 1;
        return record.attempts;
      },
      insert: async (next: IEmailVerification) => {
        record = next;
        return next;
      },
    } as unknown as EmailVerificationRepository,
    getRecord: () => record,
  };
}

describe('EmailVerificationService', () => {
  test('normalizes email and invalidates a successful challenge', async () => {
    const state = createRepository();
    const service = new EmailVerificationService(state.repository);
    const challenge = await service.create(
      ' Person@Example.COM ',
      'email',
      true,
      'f123456789abc',
    );

    await expect(
      service.verify(challenge.requestId, 'email', challenge.token),
    ).resolves.toBe('person@example.com');
    expect(state.getRecord()).toBeNull();
  });

  test('caps online guesses after five attempts', async () => {
    const state = createRepository();
    const service = new EmailVerificationService(state.repository);
    const challenge = await service.create(
      'person@example.com',
      'email',
      true,
      'f123456789abc',
    );

    for (let attempt = 0; attempt < 6; attempt += 1) {
      await expect(
        service.verify(challenge.requestId, 'email', '000000'),
      ).resolves.toBeNull();
    }

    await expect(
      service.verify(challenge.requestId, 'email', challenge.token),
    ).resolves.toBeNull();
    expect(state.getRecord()?.attempts).toBe(7);
  });
});
