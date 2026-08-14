import type { GitHubGateway } from '../gateways';
import { FormService } from './form.service';

describe('FormService', () => {
  const gitHubGateway = {
    isPublicRepository: jest.fn(),
    retrieveYamlFile: jest.fn(),
    createOrUpdateYamlFile: jest.fn(),
  } as unknown as GitHubGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(gitHubGateway.isPublicRepository).mockResolvedValue(true);
  });

  test('does not return forms from private repositories', async () => {
    jest.mocked(gitHubGateway.isPublicRepository).mockResolvedValue(false);

    const service = new FormService(gitHubGateway);

    await expect(
      service.find('acme', 'private-forms', 'contact'),
    ).resolves.toBeNull();
    expect(gitHubGateway.retrieveYamlFile).not.toHaveBeenCalled();
  });

  test('returns a form with its public URL', async () => {
    jest.mocked(gitHubGateway.retrieveYamlFile).mockResolvedValue({
      content: 'title: Contact',
      sha: 'file-sha',
    });

    const service = new FormService(gitHubGateway);

    await expect(
      service.find('acme', 'forms', 'contact'),
    ).resolves.toEqual({
      branch: 'main',
      file: 'contact',
      owner: 'acme',
      repository: 'forms',
      sha: 'file-sha',
      url: 'https://frms.dev/acme/forms/contact',
      yaml: 'title: Contact',
    });
  });

  test('creates a form', async () => {
    jest.mocked(gitHubGateway.createOrUpdateYamlFile).mockResolvedValue({
      content: 'title: Contact',
      sha: 'file-sha',
    });

    const service = new FormService(gitHubGateway);

    await expect(
      service.createOrUpdate('acme', 'forms', 'contact', 'title: Contact'),
    ).resolves.toEqual({
      branch: 'main',
      file: 'contact',
      owner: 'acme',
      repository: 'forms',
      sha: 'file-sha',
      url: 'https://frms.dev/acme/forms/contact',
    });
    expect(gitHubGateway.createOrUpdateYamlFile).toHaveBeenCalledWith(
      'acme',
      'forms',
      'contact',
      'title: Contact',
      'Create Declarative Form',
      'main',
      undefined,
    );
  });

  test('updates a form on the requested branch', async () => {
    jest.mocked(gitHubGateway.createOrUpdateYamlFile).mockResolvedValue({
      content: 'title: Updated',
      sha: 'new-file-sha',
    });

    const service = new FormService(gitHubGateway);

    await expect(
      service.createOrUpdate(
        'acme',
        'forms',
        'contact',
        'title: Updated',
        'draft',
        undefined,
        'old-file-sha',
      ),
    ).resolves.toEqual({
      branch: 'draft',
      file: 'contact',
      owner: 'acme',
      repository: 'forms',
      sha: 'new-file-sha',
      url: 'https://frms.dev/acme/forms/contact?branch=draft',
    });
    expect(gitHubGateway.createOrUpdateYamlFile).toHaveBeenCalledWith(
      'acme',
      'forms',
      'contact',
      'title: Updated',
      'Update Declarative Form',
      'draft',
      'old-file-sha',
    );
  });
});
