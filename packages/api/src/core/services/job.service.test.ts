import type { JobRepository } from '../repositories';
import { JobService } from './job.service';

describe('JobService', () => {
  const insert = jest.fn();
  const findDue = jest.fn();
  const remove = jest.fn();
  const reschedule = jest.fn();
  const repository = {
    insert,
    findDue,
    remove,
    reschedule,
  } as unknown as JobRepository;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('schedules any event data', async () => {
    const service = new JobService(repository, {});
    const data = { value: 'payload' };
    const runAt = new Date('2026-08-12T10:00:00.000Z');

    await service.schedule('example', data, runAt);

    expect(insert).toHaveBeenCalledWith({
      id: expect.any(String),
      event: 'example',
      data,
      run_at: runAt,
    });
  });

  test('handles and removes due jobs', async () => {
    const data = { submission: { id: 'submission-1' } };
    const handler = jest.fn().mockResolvedValue(undefined);
    findDue.mockResolvedValue([
      { id: 'job-1', event: 'submission', data, run_at: new Date() },
    ]);
    const service = new JobService(repository, { submission: handler });

    await expect(service.processOnce()).resolves.toBe(1);

    expect(handler).toHaveBeenCalledWith(data);
    expect(remove).toHaveBeenCalledWith('job-1');
    expect(reschedule).not.toHaveBeenCalled();
  });

  test('reschedules failed jobs one minute later', async () => {
    const now = new Date('2026-08-12T10:00:00.000Z');
    findDue.mockResolvedValue([
      { id: 'job-1', event: 'submission', data: {}, run_at: now },
    ]);
    const service = new JobService(repository, {
      submission: jest.fn().mockRejectedValue(new Error('delivery failed')),
    });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await service.processOnce(now);

    expect(remove).not.toHaveBeenCalled();
    expect(reschedule).toHaveBeenCalledWith(
      'job-1',
      new Date('2026-08-12T10:01:00.000Z'),
    );
  });
});
