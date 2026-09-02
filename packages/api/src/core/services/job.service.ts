import { randomBytes } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import type { JobRepository } from '../repositories';

export type JobHandler = (data: unknown) => Promise<void>;

export class JobService {
  constructor(
    private jobRepository: JobRepository,
    private handlers: Record<string, JobHandler>,
  ) {}

  public async schedule<T>(event: string, data: T, runAt: Date): Promise<void> {
    await this.jobRepository.insert({
      id: randomBytes(8).toString('hex'),
      event,
      data,
      run_at: runAt,
    });
  }

  public async processOnce(now = new Date()): Promise<number> {
    const jobs = await this.jobRepository.findDue(now);

    for (const job of jobs) {
      try {
        const handler = this.handlers[job.event];
        if (!handler) {
          throw new Error(`No handler registered for event: ${job.event}`);
        }

        await handler(job.data);
        await this.jobRepository.delete(job.id);
      } catch (error) {
        console.error(`Job ${job.id} failed`, error);
        await this.jobRepository.reschedule(
          job.id,
          new Date(now.getTime() + 60_000),
        );
      }
    }

    return jobs.length;
  }

  public async run(signal: AbortSignal): Promise<void> {
    await this.jobRepository.ensureIndexes();

    while (!signal.aborted) {
      const processed = await this.processOnce();
      if (processed === 0) {
        try {
          await setTimeout(1000, undefined, { signal });
        } catch (error) {
          if (!signal.aborted) {
            throw error;
          }
        }
      }
    }
  }
}
