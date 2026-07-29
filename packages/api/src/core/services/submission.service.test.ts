import type { IDeclarativeForm } from '@declarativeforms/core';
import type { SubmissionRepository } from '../repositories';
import type { IConnectionStrategy } from '../strategies';
import type { FormService } from './form.service';
import {
  SubmissionService,
  SubmissionValidationError,
} from './submission.service';

const form: IDeclarativeForm = {
  id: 'f123456789abc',
  sections: [
    {
      id: 'contact',
      fields: [{ id: 'email', type: 'email' }],
    },
  ],
  connections: [{ type: 'webhook', url: 'https://example.com/hook' }],
};

describe('SubmissionService', () => {
  test('runs connections only when a submission is completed', async () => {
    const formService = {
      resolveById: async () => ({ definition: form, trusted: true }),
    } as unknown as FormService;
    const repository = {
      insert: async () => undefined,
      update: async () => undefined,
    } as unknown as SubmissionRepository;
    const handle = jest.fn(async () => undefined);
    const connection = {
      type: 'webhook',
      handle,
    } as IConnectionStrategy;
    const service = new SubmissionService(
      formService,
      repository,
      [],
      [connection],
    );
    const metadata = { ipAddress: '', userAgent: '' };

    await service.createOrUpdate(
      form.id as string,
      { email: 'person@example.com' },
      true,
      metadata,
    );
    expect(handle).not.toHaveBeenCalled();

    await service.createOrUpdate(
      form.id as string,
      { email: 'person@example.com' },
      false,
      metadata,
    );
    expect(handle).toHaveBeenCalledTimes(1);
  });

  test('never executes connections from an untrusted public source', async () => {
    const handle = jest.fn(async () => undefined);
    const service = new SubmissionService(
      {
        resolveById: async () => ({ definition: form, trusted: false }),
      } as unknown as FormService,
      {
        insert: async () => undefined,
        update: async () => undefined,
      } as unknown as SubmissionRepository,
      [],
      [{ type: 'webhook', handle } as IConnectionStrategy],
    );

    await service.createOrUpdate(
      form.id as string,
      { email: 'person@example.com' },
      false,
      { ipAddress: '127.0.0.1', userAgent: 'test' },
    );

    expect(handle).not.toHaveBeenCalled();
  });

  test('does not downgrade an already completed submission', async () => {
    const existing = {
      created_at: '2026-01-01T00:00:00.000Z',
      data: { email: 'original@example.com' },
      form_id: form.id as string,
      id: 'submission-id',
      metadata: { ip_address: '127.0.0.1', user_agent: 'test' },
      status: 'completed' as const,
      updated_at: '2026-01-01T00:00:00.000Z',
    };
    const update = jest.fn(async () => undefined);
    const service = new SubmissionService(
      {
        resolveById: async () => ({ definition: form, trusted: true }),
      } as unknown as FormService,
      {
        find: async () => existing,
        update,
      } as unknown as SubmissionRepository,
      [],
      [],
    );

    const result = await service.createOrUpdate(
      form.id as string,
      { email: 'changed@example.com' },
      true,
      { ipAddress: '127.0.0.1', userAgent: 'test' },
      existing.id,
    );

    expect(result?.status).toBe('completed');
    expect(result?.data.email).toBe('original@example.com');
    expect(update).not.toHaveBeenCalled();
  });

  test('records failed delivery and retries it at most three times', async () => {
    let stored: Awaited<ReturnType<SubmissionService['createOrUpdate']>> = null;
    const handle = jest.fn(async () => {
      throw new Error('Destination unavailable');
    });
    const repository = {
      find: async () => stored,
      insert: async (submission: NonNullable<typeof stored>) => {
        stored = submission;
      },
      update: async (
        _formId: string,
        submission: NonNullable<typeof stored>,
      ) => {
        stored = submission;
      },
    } as unknown as SubmissionRepository;
    const service = new SubmissionService(
      {
        resolveById: async () => ({ definition: form, trusted: true }),
      } as unknown as FormService,
      repository,
      [],
      [{ type: 'webhook', handle } as IConnectionStrategy],
    );
    const metadata = { ipAddress: '127.0.0.1', userAgent: 'test' };

    stored = await service.createOrUpdate(
      form.id as string,
      { email: 'person@example.com' },
      false,
      metadata,
    );
    for (let attempt = 0; attempt < 3; attempt += 1) {
      stored = await service.createOrUpdate(
        form.id as string,
        {},
        false,
        metadata,
        stored?.id,
      );
    }

    expect(handle).toHaveBeenCalledTimes(3);
    expect(stored?.deliveries?.[0]).toMatchObject({
      attempts: 3,
      error: 'Destination unavailable',
      status: 'failed',
    });
  });

  test('rejects file references that were not uploaded for the form', async () => {
    const uploadForm: IDeclarativeForm = {
      id: 'f123456789abc',
      sections: [
        {
          id: 'files',
          fields: [{ id: 'document', type: 'file_upload' }],
          next: 'done',
        },
      ],
    };
    const service = new SubmissionService(
      {
        resolveById: async () => ({
          definition: uploadForm,
          trusted: true,
        }),
      } as unknown as FormService,
      {} as SubmissionRepository,
      [],
      [],
    );

    await expect(
      service.createOrUpdate(
        uploadForm.id as string,
        { document: ['https://attacker.example/file.pdf'] },
        false,
        { ipAddress: '127.0.0.1', userAgent: 'test' },
      ),
    ).rejects.toBeInstanceOf(SubmissionValidationError);
  });
});
