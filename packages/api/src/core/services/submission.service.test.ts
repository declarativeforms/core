import type { IDeclarativeForm, ISubmission } from '@declarativeforms/engine';
import type { SubmissionRepository } from '../repositories';
import type { FormService } from './form.service';
import type { JobService } from './job.service';
import { SubmissionService } from './submission.service';

describe('SubmissionService connection jobs', () => {
  const formService = {
    findById: jest.fn(),
  } as unknown as FormService;
  const submissionRepository = {
    find: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  } as unknown as SubmissionRepository;
  const schedule = jest.fn();
  const jobService = { schedule } as unknown as JobService;

  const form = (
    connections: IDeclarativeForm['connections'],
  ): IDeclarativeForm => ({
    id: 'a12345678',
    sections: [{ id: 'only', fields: [], next: 'done' }],
    connections,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-08-12T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('does not schedule default connections for partial submissions', async () => {
    jest
      .mocked(formService.findById)
      .mockResolvedValue(
        form([{ type: 'webhook', url: 'https://example.com/hook' }]),
      );
    const service = new SubmissionService(
      formService,
      submissionRepository,
      jobService,
    );

    await service.createOrUpdate('a12345678', { name: 'Ada' }, true, {
      ipAddress: '127.0.0.1',
      userAgent: 'test',
    });

    expect(submissionRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'partial' }),
    );
    expect(schedule).not.toHaveBeenCalled();
  });

  test('schedules a submission event with the configured delay', async () => {
    const configuredForm = form([
      {
        type: 'webhook',
        url: 'https://example.com/hook',
        delay_minutes: 30,
      },
    ]);
    jest.mocked(formService.findById).mockResolvedValue(configuredForm);
    const service = new SubmissionService(
      formService,
      submissionRepository,
      jobService,
    );

    await service.createOrUpdate('a12345678', { name: 'Ada' }, false, {
      ipAddress: '127.0.0.1',
      userAgent: 'test',
    });

    const submission = jest.mocked(submissionRepository.insert).mock
      .calls[0][0] as ISubmission;
    expect(schedule).toHaveBeenCalledWith(
      'submission',
      {
        connection: configuredForm.connections?.[0],
        form: configuredForm,
        submission,
      },
      new Date('2026-08-12T10:30:00.000Z'),
    );
  });

  test('can explicitly schedule partial submissions that match when', async () => {
    jest.mocked(formService.findById).mockResolvedValue(
      form([
        {
          type: 'webhook',
          url: 'https://example.com/hook',
          trigger_on: 'partial',
          when: "data.plan === 'pro'",
        },
      ]),
    );
    const service = new SubmissionService(
      formService,
      submissionRepository,
      jobService,
    );

    await service.createOrUpdate('a12345678', { plan: 'pro' }, true, {
      ipAddress: '',
      userAgent: '',
    });

    expect(schedule).toHaveBeenCalledWith(
      'submission',
      expect.objectContaining({
        connection: expect.objectContaining({ trigger_on: 'partial' }),
      }),
      new Date('2026-08-12T10:00:00.000Z'),
    );
  });

  test('does not schedule another event when completion is retried', async () => {
    const existing: ISubmission = {
      id: 'submission-1',
      form_id: 'a12345678',
      data: { name: 'Ada' },
      status: 'completed',
      created_at: '2026-08-12T10:00:00.000Z',
      updated_at: '2026-08-12T10:00:00.000Z',
      metadata: { ip_address: '', user_agent: '' },
    };
    jest
      .mocked(formService.findById)
      .mockResolvedValue(
        form([{ type: 'webhook', url: 'https://example.com/hook' }]),
      );
    jest.mocked(submissionRepository.find).mockResolvedValue(existing);
    const service = new SubmissionService(
      formService,
      submissionRepository,
      jobService,
    );

    await service.createOrUpdate(
      'a12345678',
      existing.data,
      false,
      { ipAddress: '', userAgent: '' },
      existing.id,
    );

    expect(schedule).not.toHaveBeenCalled();
  });
});
