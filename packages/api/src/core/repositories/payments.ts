import { getContainer } from '../container';
import type { IPaymentRecord } from '../types';

export async function findPayment(
  id: string,
): Promise<IPaymentRecord | null> {
  const container = await getContainer();

  return container.db
    .collection<IPaymentRecord>('payments')
    .findOne({ id });
}

export async function findPaymentByProviderSessionId(
  providerSessionId: string,
): Promise<IPaymentRecord | null> {
  const container = await getContainer();

  return container.db
    .collection<IPaymentRecord>('payments')
    .findOne({ provider_session_id: providerSessionId });
}

export async function insertPayment(
  record: IPaymentRecord,
): Promise<void> {
  const container = await getContainer();

  await container.db
    .collection<IPaymentRecord>('payments')
    .insertOne(record);
}

export async function updatePaymentStatus(
  providerSessionId: string,
  status: 'succeeded' | 'failed' | 'cancelled',
): Promise<void> {
  const container = await getContainer();

  await container.db
    .collection<IPaymentRecord>('payments')
    .updateOne(
      { provider_session_id: providerSessionId },
      { $set: { status, updated_at: new Date().toISOString() } },
    );
}
