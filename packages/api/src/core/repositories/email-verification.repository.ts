import type { Db } from 'mongodb';
import type { IEmailVerificationRecord } from '../types';

export class EmailVerificationRepository {
  constructor(private db: Db) {}

  public async find(id: string): Promise<IEmailVerificationRecord | null> {
    return this.db
      .collection<IEmailVerificationRecord>('email_verifications')
      .findOne(
        { id },
        {
          projection: {
            _id: 0,
          },
        },
      );
  }

  public async findMostRecent(
    email: string,
  ): Promise<IEmailVerificationRecord | null> {
    return this.db
      .collection<IEmailVerificationRecord>('email_verifications')
      .findOne({ email }, { projection: { _id: 0 }, sort: { created_at: -1 } });
  }

  public async insert(
    record: IEmailVerificationRecord,
  ): Promise<IEmailVerificationRecord> {
    await this.db
      .collection<IEmailVerificationRecord>('email_verifications')
      .insertOne(record);

    return record;
  }
}
