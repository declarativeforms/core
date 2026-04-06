import { getContainer } from '../container';
import type { IStudioMagicLinkRecord } from '../types';

export async function findStudioMagicLinkRequest(id: string): Promise<IStudioMagicLinkRecord | null> {
  const container = await getContainer();

  return container.db.collection<IStudioMagicLinkRecord>('studio_magic_link_requests').findOne({ id });
}

export async function findRecentStudioMagicLinkRequest(
  email: string,
): Promise<IStudioMagicLinkRecord | null> {
  const container = await getContainer();

  return container.db
    .collection<IStudioMagicLinkRecord>('studio_magic_link_requests')
    .findOne({ email }, { sort: { created_at: -1 } });
}

export async function insertStudioMagicLinkRequest(request: IStudioMagicLinkRecord): Promise<void> {
  const container = await getContainer();

  await container.db.collection<IStudioMagicLinkRecord>('studio_magic_link_requests').insertOne(request);
}

export async function consumeStudioMagicLinkRequest(id: string): Promise<void> {
  const container = await getContainer();

  await container.db
    .collection<IStudioMagicLinkRecord>('studio_magic_link_requests')
    .updateOne({ id }, { $set: { consumed: true } });
}
