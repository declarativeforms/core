import type { Db } from 'mongodb';
import type { IConnectionRecord } from '../types';

export class ConnectionRecordRepository {
  constructor(private db: Db) {}

  public async find(id: string): Promise<IConnectionRecord | null> {
    return this.db
      .collection<IConnectionRecord>('connection_records')
      .findOne({ id });
  }

  public async insert(record: IConnectionRecord): Promise<void> {
    await this.db
      .collection<IConnectionRecord>('connection_records')
      .insertOne(record);
  }
}
