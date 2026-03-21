import { getContainer } from '../container';
import type { IConnectionRecord } from '../types';

export async function findConnection(id: string): Promise<IConnectionRecord | null> {
  const container = await getContainer();

  return container.db.collection<IConnectionRecord>('connections').findOne({ id });
}

export async function insertConnection(record: IConnectionRecord): Promise<void> {
  const container = await getContainer();

  await container.db.collection<IConnectionRecord>('connections').insertOne(record);
}
