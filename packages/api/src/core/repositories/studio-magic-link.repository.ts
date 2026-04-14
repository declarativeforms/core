import type { Db } from 'mongodb';
import type { IStudioMagicLinkRecord } from '../types';

export class StudioMagicLinkRepository {
  constructor(private db: Db) {}

  public async find(id: string): Promise<IStudioMagicLinkRecord | null> {
    return this.db
      .collection<IStudioMagicLinkRecord>('studio_magic_links')
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
  ): Promise<IStudioMagicLinkRecord | null> {
    return this.db
      .collection<IStudioMagicLinkRecord>('studio_magic_links')
      .findOne({ email }, { projection: { _id: 0 }, sort: { created_at: -1 } });
  }

  public async insert(
    record: IStudioMagicLinkRecord,
  ): Promise<IStudioMagicLinkRecord> {
    await this.db
      .collection<IStudioMagicLinkRecord>('studio_magic_links')
      .insertOne(record);

    return record;
  }
}
