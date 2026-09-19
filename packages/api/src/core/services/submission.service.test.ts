import type { ISubmission } from '@declarativeforms/engine';
import type { Db } from 'mongodb';
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

test('lists a page of completed submissions', async () => {
  const db = {} as Db;
  const repository = new SubmissionRepository(db);
  const findAll = jest
    .spyOn(repository, 'findAllByFormIdAndStatus')
    .mockResolvedValue([
      toSubmission(
        '11111111111111111111111111111111',
        '2026-09-01T00:00:00.000Z',
      ),
    ]);
  const service = new SubmissionService(
    new FormService(new GitHubFileRepository(db), new GitHubGateway()),
    repository,
    new JobService(new JobRepository(db), {}),
    new TokenService('', 'test'),
  );

  const submissions = await service.list('a12345678', 2, 50);

  expect(submissions).toHaveLength(1);
  expect(findAll).toHaveBeenLastCalledWith('a12345678', 'completed', 2, 50);

  findAll.mockResolvedValue([]);
  expect(await service.list('a12345678', 3, 50)).toEqual([]);
});
