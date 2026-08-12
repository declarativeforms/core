import type { Db } from 'mongodb';

export type Job<T = unknown> = {
  id: string;
  event: string;
  data: T;
  run_at: Date;
};

export class JobRepository {
  constructor(private db: Db) {}

  public async ensureIndexes(): Promise<void> {
    await this.db.collection<Job>('jobs').createIndex({ run_at: 1 });
  }

  public async insert<T>(job: Job<T>): Promise<void> {
    await this.db.collection<Job<T>>('jobs').insertOne(job);
  }

  public async findDue(now: Date, limit = 25): Promise<Job[]> {
    return this.db
      .collection<Job>('jobs')
      .find({ run_at: { $lte: now } })
      .sort({ run_at: 1 })
      .limit(limit)
      .toArray();
  }

  public async remove(id: string): Promise<void> {
    await this.db.collection<Job>('jobs').deleteOne({ id });
  }

  public async reschedule(id: string, runAt: Date): Promise<void> {
    await this.db
      .collection<Job>('jobs')
      .updateOne({ id }, { $set: { run_at: runAt } });
  }
}
