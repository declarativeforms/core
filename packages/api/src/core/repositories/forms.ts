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

export async function deleteForm(id: string): Promise<boolean> {
  const container = await getContainer();

  const result = await container.db
    .collection<IFormRecord>('forms')
    .deleteOne({ id });

  return result.deletedCount > 0;
}
