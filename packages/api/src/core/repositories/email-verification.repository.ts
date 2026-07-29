import type { Db } from 'mongodb';
import type { IEmailVerification } from '../types';

export class EmailVerificationRepository {
  constructor(private db: Db) {}

  public async find(id: string): Promise<IEmailVerification | null> {
    return this.db
      .collection<IEmailVerification>('email_verifications')
      .findOne(
        { id },
        {
          projection: {
            _id: 0,
          },
        },
      );
  }

  public async insert(
    emailVerification: IEmailVerification,
  ): Promise<IEmailVerification> {
    await this.db
      .collection<IEmailVerification>('email_verifications')
      .insertOne(emailVerification);

    return emailVerification;
  }

  public async incrementAttempts(id: string): Promise<number> {
    const result = await this.db
      .collection<IEmailVerification>('email_verifications')
      .findOneAndUpdate(
        { id },
        { $inc: { attempts: 1 } },
        {
          projection: { _id: 0, attempts: 1 },
          returnDocument: 'after',
        },
      );

    return result?.attempts ?? Number.MAX_SAFE_INTEGER;
  }

  public async delete(id: string): Promise<void> {
    await this.db
      .collection<IEmailVerification>('email_verifications')
      .deleteOne({ id });
  }
}
