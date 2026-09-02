import type { Db } from 'mongodb';
import type { IJob } from '../types';

export class JobRepository {
  constructor(private db: Db) {}

  public async ensureIndexes(): Promise<void> {
    await this.db.collection<IJob>('jobs').createIndex({ run_at: 1 });
  }

  public async insert<T>(job: IJob<T>): Promise<void> {
    await this.db.collection<IJob<T>>('jobs').insertOne(job);
  }

  public async findDue(limit = 25): Promise<Array<IJob>> {
    return this.db
      .collection<IJob>('jobs')
      .find({ run_at: { $lte: new Date() } })
      .sort({ run_at: 1 })
      .limit(limit)
      .toArray();
  }

  public async delete(id: string): Promise<void> {
    await this.db.collection<IJob>('jobs').deleteOne({ id });
  }

  public async reschedule(id: string, runAt: Date): Promise<void> {
    await this.db
      .collection<IJob>('jobs')
      .updateOne({ id }, { $set: { run_at: runAt } });
  }
}
