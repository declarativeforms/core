import { getContainer } from '../container';
import type { IFormRecord } from '../types';

export async function findForm(id: string): Promise<IFormRecord | null> {
  const container = await getContainer();

  return container.db.collection<IFormRecord>('forms').findOne({ id });
}

export async function upsertForm(record: IFormRecord): Promise<void> {
  const container = await getContainer();

  await container.db.collection<IFormRecord>('forms').replaceOne(
    { id: record.id },
    record,
    { upsert: true },
  );
}
