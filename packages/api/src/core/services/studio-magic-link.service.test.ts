import type { StudioMagicLinkRepository } from '../repositories';
import type { IStudioMagicLinkRecord } from '../types';
import { StudioMagicLinkService } from './studio-magic-link.service';

class FakeStudioMagicLinkRepository {
  private records = new Map<string, IStudioMagicLinkRecord>();

  public async find(id: string): Promise<IStudioMagicLinkRecord | null> {
    return this.records.get(id) ?? null;
  }

  public async findMostRecent(
    email: string,
  ): Promise<IStudioMagicLinkRecord | null> {
    const records = [...this.records.values()].filter(
      (record) => record.email === email,
    );

    return records.at(-1) ?? null;
  }

  public async insert(
    record: IStudioMagicLinkRecord,
  ): Promise<IStudioMagicLinkRecord> {
    this.records.set(record.id, record);

    return record;
  }
}

function createService() {
  const repository = new FakeStudioMagicLinkRepository();
  const service = new StudioMagicLinkService(
    repository as unknown as StudioMagicLinkRepository,
  );

  return {
    repository,
    service,
  };
}

test('create stores salt and verify succeeds with matching token and salt', async () => {
  const { repository, service } = createService();

  const result = await service.create('user@example.com', 'sign_in');

  expect(result).not.toBeNull();

  const record = await repository.find(result!.requestId);

  expect(record).toMatchObject({
    email: 'user@example.com',
    id: result!.requestId,
    salt: 'sign_in',
  });
  expect(record?.secret_hash).not.toBe(result!.token);

  await expect(
    service.verify({
      requestId: result!.requestId,
      salt: 'sign_in',
      token: result!.token,
    }),
  ).resolves.toBe('user@example.com');
});

test('verify fails when record does not exist', async () => {
  const { service } = createService();

  await expect(
    service.verify({
      requestId: 'missing',
      salt: 'sign_in',
      token: 'token',
    }),
  ).resolves.toBeNull();
});

test('verify fails when salt does not match', async () => {
  const { service } = createService();
  const result = await service.create('user@example.com', 'sign_in');

  await expect(
    service.verify({
      requestId: result!.requestId,
      salt: 'other_salt',
      token: result!.token,
    }),
  ).resolves.toBeNull();
});

test('verify fails when token does not match', async () => {
  const { service } = createService();
  const result = await service.create('user@example.com', 'sign_in');

  await expect(
    service.verify({
      requestId: result!.requestId,
      salt: 'sign_in',
      token: 'wrong-token',
    }),
  ).resolves.toBeNull();
});

test('verify fails when record is expired', async () => {
  const { repository, service } = createService();

  await repository.insert({
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    email: 'user@example.com',
    expires_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    id: 'expired01',
    salt: 'sign_in',
    secret_hash: 'irrelevant',
  });

  await expect(
    service.verify({
      requestId: 'expired01',
      salt: 'sign_in',
      token: 'token',
    }),
  ).resolves.toBeNull();
});
