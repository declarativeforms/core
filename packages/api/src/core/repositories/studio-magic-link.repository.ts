import type { Db } from 'mongodb';
import type { IStudioMagicLinkRecord } from '../types';

export class StudioMagicLinkRepository {
  constructor(private db: Db) {}

  public async find(id: string): Promise<IStudioMagicLinkRecord | null> {
    return this.db
      .collection<IStudioMagicLinkRecord>('studio_magic_links')
      .findOne({ id });
  }

  public async findMostRecent(email: string): Promise<IStudioMagicLinkRecord | null> {
    return this.db
      .collection<IStudioMagicLinkRecord>('studio_magic_links')
      .findOne({ email }, { sort: { created_at: -1 } });
  }

  public async insert(record: IStudioMagicLinkRecord): Promise<void> {
    await this.db
      .collection<IStudioMagicLinkRecord>('studio_magic_links')
      .insertOne(record);
  }
}
