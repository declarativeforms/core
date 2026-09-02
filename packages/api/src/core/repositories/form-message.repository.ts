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
    await this.db.collection<IFormMessage>('form_messages').createIndex(
      { branch: 1, form_id: 1, origin_message_id: 1 },
      {
        partialFilterExpression: { origin_message_id: { $type: 'string' } },
        unique: true,
      },
    );
    await this.db.collection<IFormMessage>('form_messages').createIndex(
      { branch: 1, form_id: 1, generation_id: 1, role: 1 },
      {
        partialFilterExpression: { generation_id: { $type: 'string' } },
        unique: true,
      },
    );
  }

  public async listByBranch(
    formId: string,
    organizationId: string,
    branch: string,
    before: number | null,
    limit: number,
  ): Promise<Array<IFormMessage>> {
    const filter: Record<string, unknown> = {
      branch,
      form_id: formId,
      organization_id: organizationId,
    };

    if (before !== null) {
      filter.sequence = { $lt: before };
    }

    return this.db
      .collection<IFormMessage>('form_messages')
      .find(filter as any, { projection: { _id: 0 } })
      .sort({ sequence: -1 })
      .limit(limit)
      .toArray() as Promise<Array<IFormMessage>>;
  }

  public async listAuthoredByBranch(
    formId: string,
    branch: string,
    limit: number,
  ): Promise<Array<IFormMessage>> {
    return this.db
      .collection<IFormMessage>('form_messages')
      .find({ branch, form_id: formId, origin_message_id: null } as any, {
        projection: { _id: 0 },
      })
      .sort({ sequence: 1 })
      .limit(limit)
      .toArray() as Promise<Array<IFormMessage>>;
  }

  public async findOriginIds(
    formId: string,
    branch: string,
  ): Promise<Array<string>> {
    const documents = await this.db
      .collection<IFormMessage>('form_messages')
      .find(
        { branch, form_id: formId, origin_message_id: { $ne: null } } as any,
        {
          projection: { _id: 0, origin_message_id: 1 },
        },
      )
      .toArray();

    return documents
      .map((document) => document.origin_message_id)
      .filter((id): id is string => id !== null);
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

  public async listByGeneration(
    formId: string,
    branch: string,
    generationId: string,
  ): Promise<Array<IFormMessage>> {
    return this.db
      .collection<IFormMessage>('form_messages')
      .find({ branch, form_id: formId, generation_id: generationId } as any, {
        projection: { _id: 0 },
      })
      .sort({ sequence: 1 })
      .toArray() as Promise<Array<IFormMessage>>;
  }

  public async insert(message: IFormMessage): Promise<void> {
    await this.db
      .collection<IFormMessage>('form_messages')
      .insertOne(message as any);
  }

  public async complete(
    id: string,
    content: string,
    schemaRevision: number,
  ): Promise<boolean> {
    const result = await this.db
      .collection<IFormMessage>('form_messages')
      .updateOne(
        { id } as any,
        {
          $set: {
            content,
            schema_revision: schemaRevision,
            status: 'complete',
          },
        } as any,
      );

    return result.modifiedCount > 0;
  }

  public async fail(id: string, content: string): Promise<boolean> {
    const result = await this.db
      .collection<IFormMessage>('form_messages')
      .updateOne(
        { id } as any,
        {
          $set: { content, status: 'failed' },
        } as any,
      );

    return result.modifiedCount > 0;
  }

  public async insertMany(messages: Array<IFormMessage>): Promise<number> {
    if (messages.length === 0) {
      return 0;
    }

    try {
      const result = await this.db
        .collection<IFormMessage>('form_messages')
        .insertMany(messages as any, { ordered: false });

      return result.insertedCount;
    } catch (error: any) {
      const writeErrors: Array<{ code?: number }> = error?.writeErrors ?? [];

      if (
        error?.code !== 11000 &&
        !writeErrors.every((entry) => entry?.code === 11000)
      ) {
        throw error;
      }

      return error?.result?.insertedCount ?? 0;
    }
  }

  public async delete(formId: string, branch: string): Promise<number> {
    const result = await this.db
      .collection<IFormMessage>('form_messages')
      .deleteMany({ branch, form_id: formId } as any);

    return result.deletedCount;
  }
}
