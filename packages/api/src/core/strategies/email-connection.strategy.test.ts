import type { IEmailConnection, ISubmission } from '@declarativeforms/engine';
import { MongoClient } from 'mongodb';
import { JobRepository } from '../repositories/job.repository';
import { JobService } from '../services/job.service';
import { EmailConnectionStrategy } from './email-connection.strategy';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}));

const mockSend = jest.fn();
const now = Date.parse('2026-10-21T09:14:48.000Z');
const connection: IEmailConnection = {
  type: 'email',
  to: 'agent@example.com',
  subject: 'New lead — {{data.first_name}}',
  body: '<p>{{data.first_name}}</p>',
};
const submission: ISubmission = {
  id: 'submission',
  form_id: 'form',
  status: 'completed',
  data: { first_name: 'Jane' },
  created_at: new Date(now).toISOString(),
  updated_at: new Date(now).toISOString(),
  metadata: { ip_address: '127.0.0.1', user_agent: 'test' },
};
const job = {
  id: 'email-job',
  event: 'submission',
  data: { connection, submission, form: {} },
  run_at: new Date(now),
};

let repository: JobRepository;
let service: JobService;

beforeEach(() => {
  mockSend.mockReset();
  jest.spyOn(Date, 'now').mockReturnValue(now);
  jest.spyOn(console, 'error').mockImplementation(() => {});
  repository = new JobRepository(
    new MongoClient('mongodb://localhost:27017').db('test'),
  );
  jest.spyOn(repository, 'findAllByRunAtBeforeNow').mockResolvedValue([job]);
  jest.spyOn(repository, 'delete').mockResolvedValue(undefined);
  jest.spyOn(repository, 'setRunAt').mockResolvedValue(undefined);
  const strategy = new EmailConnectionStrategy();
  service = new JobService(repository, {
    submission: () => strategy.deliver(connection, submission, {}),
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test.each([
  {
    statusCode: 403,
    name: 'validation_error',
    message: 'Sender domain is not verified',
  },
  {
    statusCode: 429,
    name: 'rate_limit_exceeded',
    message: 'Too many requests',
  },
])(
  'retains and logs email jobs rejected by Resend with $statusCode',
  async (error) => {
    mockSend.mockResolvedValue({ data: null, error });

    await expect(service.processOnce()).resolves.toBe(1);

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(repository.delete).not.toHaveBeenCalled();
    expect(repository.setRunAt).toHaveBeenCalledTimes(1);
    expect(repository.setRunAt).toHaveBeenCalledWith(
      job.id,
      new Date(now + 60_000),
    );
    expect(console.error).toHaveBeenCalledWith(
      'Job email-job failed',
      new Error('Resend email failed: ' + error.name + ': ' + error.message),
    );
  },
);

test('retains and logs email jobs when Resend throws', async () => {
  const error = new Error('Network unavailable');
  mockSend.mockRejectedValue(error);

  await service.processOnce();

  expect(repository.delete).not.toHaveBeenCalled();
  expect(repository.setRunAt).toHaveBeenCalledWith(
    job.id,
    new Date(now + 60_000),
  );
  expect(console.error).toHaveBeenCalledWith('Job email-job failed', error);
});

test('deletes accepted email jobs without logging or retrying', async () => {
  mockSend.mockResolvedValue({ data: { id: 'resend-message' }, error: null });

  await service.processOnce();

  expect(mockSend).toHaveBeenCalledWith(
    expect.objectContaining({
      to: 'agent@example.com',
      subject: 'New lead — Jane',
      html: '<p>Jane</p>',
    }),
  );
  expect(repository.delete).toHaveBeenCalledTimes(1);
  expect(repository.delete).toHaveBeenCalledWith(job.id);
  expect(repository.setRunAt).not.toHaveBeenCalled();
  expect(console.error).not.toHaveBeenCalled();
});
