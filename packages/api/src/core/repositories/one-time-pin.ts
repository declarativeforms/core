import { getContainer } from '../container';
import type { IOneTimePinRecord } from '../types';

export async function findOneTimePinRequest(id: string): Promise<IOneTimePinRecord | null> {
  const container = await getContainer();

  return container.db.collection<IOneTimePinRecord>('one_time_pin_requests').findOne({ id });
}

export async function findRecentOneTimePinRequest(
  email: string,
  fieldId: string,
): Promise<IOneTimePinRecord | null> {
  const container = await getContainer();

  return container.db
    .collection<IOneTimePinRecord>('one_time_pin_requests')
    .findOne({ email, field_id: fieldId }, { sort: { created_at: -1 } });
}

export async function insertOneTimePinRequest(request: IOneTimePinRecord): Promise<void> {
  const container = await getContainer();

  await container.db.collection<IOneTimePinRecord>('one_time_pin_requests').insertOne(request);
}

export async function incrementOneTimePinVerifyAttempts(id: string): Promise<void> {
  const container = await getContainer();

  await container.db
    .collection<IOneTimePinRecord>('one_time_pin_requests')
    .updateOne({ id }, { $inc: { verify_attempts: 1 } });
}

export async function consumeOneTimePinRequest(id: string): Promise<void> {
  const container = await getContainer();

  await container.db
    .collection<IOneTimePinRecord>('one_time_pin_requests')
    .updateOne({ id }, { $set: { consumed: true } });
}
