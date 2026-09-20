import type { ISubmission } from '@declarativeforms/engine';
import type { Db } from 'mongodb';
import { createHmac } from 'node:crypto';
import { GitHubGateway } from '../gateways';
import {
  GitHubFileRepository,
  JobRepository,
  SubmissionRepository,
} from '../repositories';
import { FormService } from './form.service';
import { JobService } from './job.service';
import { SubmissionService } from './submission.service';
import { TokenService } from './token.service';

const AUTHENTICATION_MESSAGE = 'frms.dev authentication';

function buildAuthenticationVerifier(accessKey: string): string {
  return createHmac('sha256', accessKey)
    .update(AUTHENTICATION_MESSAGE)
    .digest('hex');
}

function toSubmission(id: string, createdAt: string): ISubmission {
  return {
    created_at: createdAt,
    data: { answer: id },
    form_id: 'a12345678',
    id,
    metadata: { ip_address: '127.0.0.1', user_agent: 'test' },
    status: 'completed',
    updated_at: createdAt,
  };
}

test('lists completed submissions only with a valid access key', async () => {
  const db = {} as Db;
  const formService = new FormService(
    new GitHubFileRepository(db),
    new GitHubGateway(),
  );
  const repository = new SubmissionRepository(db);
  const findForm = jest.spyOn(formService, 'findById');
  const findPage = jest
    .spyOn(repository, 'findPageByFormIdAndStatus')
    .mockResolvedValue([
      toSubmission(
        '11111111111111111111111111111111',
        '2026-09-01T00:00:00.000Z',
      ),
    ]);
  const service = new SubmissionService(
    formService,
    repository,
    new JobService(new JobRepository(db), {}),
    new TokenService('', 'test'),
  );
  const accessKey = Buffer.alloc(32, 1).toString('base64');
  const replacementKey = Buffer.alloc(32, 2).toString('base64');

  findForm.mockResolvedValue({
    authentication: { verifier: buildAuthenticationVerifier(accessKey) },
  });

  const submissions = await service.list('a12345678', accessKey, 2, 50);

  expect(submissions).toHaveLength(1);
  expect(findPage).toHaveBeenLastCalledWith('a12345678', 'completed', 2, 50);

  findPage.mockResolvedValue([]);
  expect(await service.list('a12345678', accessKey, 3, 50)).toEqual([]);

  findPage.mockClear();
  expect(await service.list('a12345678', replacementKey, 1, 100)).toBeNull();
  expect(await service.list('a12345678', 'human-password', 1, 100)).toBeNull();
  expect(findPage).not.toHaveBeenCalled();

  findForm.mockResolvedValue({ authentication: { verifier: 'invalid' } });
  expect(await service.list('a12345678', accessKey, 1, 100)).toBeNull();

  findForm.mockResolvedValue({});
  expect(await service.list('a12345678', accessKey, 1, 100)).toBeNull();

  findForm.mockResolvedValue(null);
  expect(await service.list('a12345678', accessKey, 1, 100)).toBeNull();

  findForm.mockResolvedValue({
    authentication: {
      verifier: buildAuthenticationVerifier(replacementKey),
    },
  });
  expect(await service.list('a12345678', accessKey, 1, 100)).toBeNull();
  expect(await service.list('a12345678', replacementKey, 1, 100)).toEqual([]);
});
