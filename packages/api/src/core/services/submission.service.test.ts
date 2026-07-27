import type { IDeclarativeForm } from '@declarativeforms/core';
import type { SubmissionRepository } from '../repositories';
import type { IConnectionStrategy } from '../strategies';
import type { FormService } from './form.service';
import { SubmissionService } from './submission.service';

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
      findById: async () => form,
    } as unknown as FormService;
    const repository = {
      insert: async () => undefined,
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
});
