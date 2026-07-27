import type { Db } from 'mongodb';
import type { IGitHubFile } from '../types';

export class GitHubFileRepository {
  constructor(private db: Db) {}

  public async find(id: string): Promise<IGitHubFile | null> {
    return this.db.collection<IGitHubFile>('github_files').findOne(
      { id },
      {
        projection: {
          _id: 0,
          access_token: 0,
        },
      },
    );
  }

  public async upsert(gitHubFile: IGitHubFile): Promise<void> {
    await this.db
      .collection<IGitHubFile>('github_files')
      .replaceOne({ id: gitHubFile.id }, gitHubFile, { upsert: true });
  }
}
