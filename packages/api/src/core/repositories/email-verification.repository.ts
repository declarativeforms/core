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
}
