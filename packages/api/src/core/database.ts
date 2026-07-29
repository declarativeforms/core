import type { Db } from 'mongodb';

export async function ensureDatabaseIndexes(db: Db): Promise<void> {
  await Promise.all([
    db
      .collection('submissions')
      .createIndex({ form_id: 1, id: 1 }, { unique: true }),
    db.collection('submissions').createIndex({ form_id: 1, updated_at: -1 }),
    db
      .collection('email_verifications')
      .createIndex({ id: 1 }, { unique: true }),
    db
      .collection('email_verifications')
      .createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }),
  ]);
}
