import type { Db } from 'mongodb';
import type { IGitHubFile } from '../types';

export class GitHubFileRepository {
  constructor(private db: Db) {}

  public async find(id: string): Promise<IGitHubFile | null> {
    return this.db.collection<IGitHubFile>('github_files').findOne({ id });
  }

  public async upsert(record: IGitHubFile): Promise<void> {
    await this.db
      .collection<IGitHubFile>('github_files')
      .replaceOne({ id: record.id }, record, { upsert: true });
  }
}
