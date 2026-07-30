import type { GitHubGateway } from '../gateways';
import type { GitHubFileRepository } from '../repositories';
import { FormService } from './form.service';

describe('FormService', () => {
  const gitHubFileRepository = {
    find: jest.fn(),
  } as unknown as GitHubFileRepository;
  const gitHubGateway = {
    retrieveYamlFile: jest.fn(),
  } as unknown as GitHubGateway;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not resolve retired b-prefixed form IDs', async () => {
    const service = new FormService(gitHubFileRepository, gitHubGateway);

    await expect(service.findById('b12345678')).resolves.toBeNull();
    expect(gitHubFileRepository.find).not.toHaveBeenCalled();
    expect(gitHubGateway.retrieveYamlFile).not.toHaveBeenCalled();
  });

  test('continues to resolve GitHub-backed form IDs', async () => {
    jest.mocked(gitHubFileRepository.find).mockResolvedValue({
      file: 'contact',
      id: 'a12345678',
      owner: 'acme',
      repository: 'forms',
    });
    jest
      .mocked(gitHubGateway.retrieveYamlFile)
      .mockResolvedValue('title: Contact');

    const service = new FormService(gitHubFileRepository, gitHubGateway);

    await expect(service.findById('a12345678')).resolves.toEqual({
      id: 'a12345678',
      title: 'Contact',
    });
    expect(gitHubGateway.retrieveYamlFile).toHaveBeenCalledWith(
      'acme',
      'forms',
      'contact',
    );
  });
});
