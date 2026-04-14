import type { ISubmission } from '@declarativeforms/types';
import { SubmissionService } from './submission.service';

function createSubmissionService() {
  const formService = {
    findById: jest.fn(),
  };
  const gitHubFileRepository = {
    find: jest.fn(),
  };
  const submissionRepository = {
    find: jest.fn(),
    findAll: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  };
  const gitHubGateway = {
    hasAdminOrPushPermissions: jest.fn(),
  };

  const service = new SubmissionService(
    formService as any,
    gitHubFileRepository as any,
    submissionRepository as any,
    gitHubGateway as any,
    [],
    [],
  );

  return {
    service,
    formService,
    gitHubFileRepository,
    submissionRepository,
    gitHubGateway,
  };
}

describe('SubmissionService', () => {
  test('listFormSubmissions rejects non-github ids', async () => {
    const { service, gitHubFileRepository } = createSubmissionService();

    const result = await service.listFormSubmissions('b12345678', 'token');

    expect(result).toBeNull();
    expect(gitHubFileRepository.find).not.toHaveBeenCalled();
  });

  test('listFormSubmissions authorizes github ids via github_files mapping', async () => {
    const { service, gitHubFileRepository, submissionRepository, gitHubGateway } =
      createSubmissionService();
    const submissions: ISubmission[] = [
      {
        created_at: '2026-04-13T00:00:00.000Z',
        data: {},
        form_id: 'a12345678',
        id: 'sub12345',
        metadata: {
          ip_address: '127.0.0.1',
          user_agent: 'jest',
        },
        status: 'completed',
        updated_at: '2026-04-13T00:00:00.000Z',
      },
    ];

    gitHubFileRepository.find.mockResolvedValue({
      file: 'contact',
      id: 'a12345678',
      owner: 'acme',
      repository: 'website',
    });
    gitHubGateway.hasAdminOrPushPermissions.mockResolvedValue(true);
    submissionRepository.findAll.mockResolvedValue(submissions);

    const result = await service.listFormSubmissions('a12345678', 'token');

    expect(gitHubGateway.hasAdminOrPushPermissions).toHaveBeenCalledWith(
      'token',
      'acme',
      'website',
    );
    expect(result).toEqual(submissions);
  });

  test('listStudioFormSubmissions rejects non-studio ids', async () => {
    const { service, formService } = createSubmissionService();

    const result = await service.listStudioFormSubmissions('a12345678');

    expect(result).toBeNull();
    expect(formService.findById).not.toHaveBeenCalled();
  });
});
