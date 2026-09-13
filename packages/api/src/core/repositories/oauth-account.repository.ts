import type { Db } from 'mongodb';
import type { IOAuthAccount } from '../types';

export class OAuthAccountRepository {
  constructor(private db: Db) {}

  public async ensureIndexes(): Promise<void> {
    await this.db
      .collection<IOAuthAccount>('oauth_accounts')
      .createIndex({ id: 1 }, { unique: true });
    await this.db
      .collection<IOAuthAccount>('oauth_accounts')
      .createIndex({ provider: 1, subject: 1 }, { unique: true });
  }

  public findById(id: string): Promise<IOAuthAccount | null> {
    return this.db
      .collection<IOAuthAccount>('oauth_accounts')
      .findOne({ id }, { projection: { _id: 0 } });
  }

  public findByProviderAndSubject(
    provider: string,
    subject: string,
  ): Promise<IOAuthAccount | null> {
    return this.db
      .collection<IOAuthAccount>('oauth_accounts')
      .findOne({ provider, subject }, { projection: { _id: 0 } });
  }

  public async insert(account: IOAuthAccount): Promise<void> {
    await this.db
      .collection<IOAuthAccount>('oauth_accounts')
      .insertOne(account);
  }

  public async setEmailAddress(
    id: string,
    emailAddress: string,
  ): Promise<void> {
    await this.db.collection<IOAuthAccount>('oauth_accounts').updateOne(
      { id },
      {
        $set: {
          email_address: emailAddress,
          updated_at: new Date(),
        },
      },
    );
  }
}
