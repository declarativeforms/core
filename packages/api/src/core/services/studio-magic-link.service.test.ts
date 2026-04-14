import * as crypto from 'crypto';
import { StudioMagicLinkService } from './studio-magic-link.service';

describe('StudioMagicLinkService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
});

  test('createRequest stores a hashed token and returns request facts', async () => {
    const repository = {
      findMostRecent: jest.fn().mockResolvedValue(null),
      insert: jest.fn(),
    };
    const service = new StudioMagicLinkService(repository as any);

    const result = await service.createRequest({
      email: 'person@example.com',
    });

    expect(result).toEqual({
      requestId: 'xxxxxxxx',
      resendAfterSeconds: 30,
      token: expect.any(String),
    });
    expect(repository.findMostRecent).toHaveBeenCalledWith('person@example.com');
    expect(repository.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'person@example.com',
        id: 'xxxxxxxx',
        secret_hash: crypto
          .createHash('sha256')
          .update(result!.token)
          .digest('hex'),
      }),
    );
  });

  test('createRequest returns null during the resend cooldown window', async () => {
    const repository = {
      findMostRecent: jest.fn().mockResolvedValue({
        created_at: new Date().toISOString(),
      }),
      insert: jest.fn(),
    };
    const service = new StudioMagicLinkService(repository as any);

    const result = await service.createRequest({
      email: 'person@example.com',
    });

    expect(result).toBeNull();
    expect(repository.insert).not.toHaveBeenCalled();
  });

  test('verifyToken returns the stored email for a valid token', async () => {
    const repository = {
      find: jest.fn().mockResolvedValue({
        created_at: '2026-04-13T00:00:00.000Z',
        email: 'person@example.com',
        expires_at: '2999-01-01T00:00:00.000Z',
        id: 'request1',
        secret_hash: crypto.createHash('sha256').update('secret').digest('hex'),
      }),
    };
    const service = new StudioMagicLinkService(repository as any);

    const result = await service.verifyToken({
      requestId: 'request1',
      token: 'secret',
    });

    expect(result).toBe('person@example.com');
  });

  test('verifyToken returns null for an invalid token', async () => {
    const repository = {
      find: jest.fn().mockResolvedValue({
        created_at: '2026-04-13T00:00:00.000Z',
        email: 'person@example.com',
        expires_at: '2999-01-01T00:00:00.000Z',
        id: 'request1',
        secret_hash: crypto.createHash('sha256').update('secret').digest('hex'),
      }),
    };
    const service = new StudioMagicLinkService(repository as any);

    const result = await service.verifyToken({
      requestId: 'request1',
      token: 'wrong',
    });

    expect(result).toBeNull();
  });
});
