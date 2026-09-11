import type { Db } from 'mongodb';
import type { IFormMessage } from '../types';

export class FormMessageRepository {
  constructor(private db: Db) {}

  public async ensureIndexes(): Promise<void> {
    await this.db
      .collection<IFormMessage>('form_messages')
      .createIndex({ id: 1 }, { unique: true });
    await this.db
      .collection<IFormMessage>('form_messages')
      .createIndex({ branch: 1, form_id: 1, sequence: -1 }, { unique: true });
  }

  public findAllByOrganizationIdAndFormIdAndBranch(
    organizationId: string,
    formId: string,
    branch: string,
  ): Promise<Array<IFormMessage>> {
    return this.db
      .collection<IFormMessage>('form_messages')
      .find(
        {
          branch,
          form_id: formId,
          organization_id: organizationId,
        } as any,
        { projection: { _id: 0 } },
      )
      .sort({ sequence: 1 })
      .toArray() as Promise<Array<IFormMessage>>;
  }

  public async allocateSequences(
    formId: string,
    branch: string,
    count: number,
  ): Promise<number> {
    const document = await this.db
      .collection<{ _id: string; value: number }>('message_sequences')
      .findOneAndUpdate(
        { _id: `${formId}:${branch}` },
        { $inc: { value: count } },
        { returnDocument: 'after', upsert: true },
      );

    return (document?.value ?? count) - count + 1;
  }

  public async insertMany(messages: Array<IFormMessage>): Promise<void> {
    if (messages.length === 0) {
      return;
    }

    await this.db
      .collection<IFormMessage>('form_messages')
      .insertMany(messages as any);
  }

  public async deleteAllByFormIdAndBranch(
    formId: string,
    branch: string,
  ): Promise<void> {
    await this.db
      .collection<IFormMessage>('form_messages')
      .deleteMany({ branch, form_id: formId } as any);
  }
}
