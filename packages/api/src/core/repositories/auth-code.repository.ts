import type { Db } from 'mongodb';
import type { IAuthCode } from '../types';

export class AuthCodeRepository {
  constructor(private db: Db) {}

  public async ensureIndexes(): Promise<void> {
    await this.db
      .collection<IAuthCode>('auth_codes')
      .createIndex({ id: 1 }, { unique: true });
    await this.db
      .collection<IAuthCode>('auth_codes')
      .createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
  }

  public async insert(authCode: IAuthCode): Promise<void> {
    await this.db.collection<IAuthCode>('auth_codes').insertOne(authCode);
  }

  public async consume(id: string): Promise<boolean> {
    const result = await this.db
      .collection<IAuthCode>('auth_codes')
      .deleteOne({ id });

    return result.deletedCount > 0;
  }
}
