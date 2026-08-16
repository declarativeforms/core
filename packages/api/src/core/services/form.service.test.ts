import type { GitHubGateway } from '../gateways';
import type { GitHubFileRepository } from '../repositories';
import { FormService } from './form.service';

describe('FormService', () => {
  const formYaml = [
    'title: Contact',
    'sections:',
    '  - id: contact',
    '    fields: []',
    '    next: done',
  ].join('\n');
  const gitHubFileRepository = {
    find: jest.fn(),
    upsert: jest.fn(),
  } as unknown as GitHubFileRepository;
  const gitHubGateway = {
    createOrUpdateYamlFile: jest.fn(),
    isPublicRepository: jest.fn(),
    retrieveYamlFileMetadata: jest.fn(),
    retrieveYamlFile: jest.fn(),
  } as unknown as GitHubGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(gitHubGateway.isPublicRepository).mockResolvedValue(true);
    jest.mocked(gitHubGateway.retrieveYamlFileMetadata).mockResolvedValue({});
  });

  test('does not resolve retired b-prefixed form IDs', async () => {
    const service = new FormService(gitHubFileRepository, gitHubGateway);

    await expect(service.findById('b12345678')).resolves.toBeNull();
    expect(gitHubFileRepository.find).not.toHaveBeenCalled();
    expect(gitHubGateway.retrieveYamlFile).not.toHaveBeenCalled();
  });

  test('continues to resolve GitHub-backed form IDs from their stored branch', async () => {
    jest.mocked(gitHubFileRepository.find).mockResolvedValue({
      branch: 'main',
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
      'main',
    );
  });

  test('stores GitHub form metadata (with branch) without credentials', async () => {
    jest
      .mocked(gitHubGateway.retrieveYamlFile)
      .mockResolvedValue('title: Private form');

    const service = new FormService(gitHubFileRepository, gitHubGateway);
    const form = await service.findBySlug('forms/acme/private-forms/contact');

    expect(form).toMatchObject({
      id: expect.stringMatching(/^a[a-f0-9]{8}$/),
      title: 'Private form',
    });
    expect(gitHubFileRepository.upsert).toHaveBeenCalledWith({
      branch: 'main',
      file: 'contact',
      id: form?.id,
      owner: 'acme',
      repository: 'private-forms',
    });
  });

  test('returns the source used to update a public form', async () => {
    jest.mocked(gitHubGateway.retrieveYamlFile).mockResolvedValue(formYaml);
    const service = new FormService(gitHubFileRepository, gitHubGateway);

    await expect(
      service.findSource('acme', 'forms', 'contact', 'draft'),
    ).resolves.toEqual({
      branch: 'draft',
      file: 'contact',
      owner: 'acme',
      repository: 'forms',
      url: 'https://frms.dev/acme/forms/contact?branch=draft',
      yaml: formYaml,
    });
  });

  test('resolves and stores a form from a specified branch', async () => {
    jest
      .mocked(gitHubGateway.retrieveYamlFile)
      .mockResolvedValue('title: Feature form');

    const service = new FormService(gitHubFileRepository, gitHubGateway);
    const form = await service.findBySlug(
      'forms/acme/forms/contact',
      'feature-branch',
    );

    expect(gitHubGateway.retrieveYamlFile).toHaveBeenCalledWith(
      'acme',
      'forms',
      'contact',
      'feature-branch',
    );
    expect(gitHubFileRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ branch: 'feature-branch' }),
    );
    // The same file on a different branch resolves to a different short id.
    const mainForm = await service.findBySlug('forms/acme/forms/contact');
    expect(form?.id).not.toEqual(mainForm?.id);
  });

  test('rejects invalid YAML before calling GitHub', async () => {
    const service = new FormService(gitHubFileRepository, gitHubGateway);

    await expect(
      service.publish('acme', 'forms', 'contact', 'title: [', 'github-token'),
    ).rejects.toThrow();
    expect(gitHubGateway.isPublicRepository).not.toHaveBeenCalled();
  });

  test('rejects YAML that cannot render as a form', async () => {
    const service = new FormService(gitHubFileRepository, gitHubGateway);

    await expect(
      service.publish(
        'acme',
        'forms',
        'contact',
        'title: Missing sections',
        'github-token',
      ),
    ).rejects.toThrow('Cannot render a form with no sections');
    expect(gitHubGateway.isPublicRepository).not.toHaveBeenCalled();
  });

  test('does not publish forms to private repositories', async () => {
    jest.mocked(gitHubGateway.isPublicRepository).mockResolvedValue(false);
    const service = new FormService(gitHubFileRepository, gitHubGateway);

    await expect(
      service.publish(
        'acme',
        'private-forms',
        'contact',
        formYaml,
        'github-token',
      ),
    ).resolves.toBeNull();
    expect(gitHubGateway.retrieveYamlFileMetadata).not.toHaveBeenCalled();
  });

  test('creates a new form and returns its public URL', async () => {
    jest
      .mocked(gitHubGateway.createOrUpdateYamlFile)
      .mockResolvedValue('new-file-sha');
    const service = new FormService(gitHubFileRepository, gitHubGateway);

    await expect(
      service.publish('acme', 'forms', 'contact', formYaml, 'github-token'),
    ).resolves.toEqual({
      branch: 'main',
      file: 'contact',
      owner: 'acme',
      repository: 'forms',
      sha: 'new-file-sha',
      url: 'https://frms.dev/acme/forms/contact',
    });
    expect(gitHubGateway.createOrUpdateYamlFile).toHaveBeenCalledWith(
      'acme',
      'forms',
      'contact',
      formYaml,
      'Create Declarative Form',
      'main',
      'github-token',
      undefined,
    );
  });

  test('updates an existing form on the requested branch', async () => {
    jest
      .mocked(gitHubGateway.retrieveYamlFileMetadata)
      .mockResolvedValue({ sha: 'old-file-sha' });
    jest
      .mocked(gitHubGateway.createOrUpdateYamlFile)
      .mockResolvedValue('new-file-sha');
    const service = new FormService(gitHubFileRepository, gitHubGateway);

    await expect(
      service.publish(
        'acme',
        'forms',
        'contact',
        formYaml,
        'github-token',
        'draft',
        'Publish draft form',
      ),
    ).resolves.toMatchObject({
      branch: 'draft',
      sha: 'new-file-sha',
      url: 'https://frms.dev/acme/forms/contact?branch=draft',
    });
    expect(gitHubGateway.createOrUpdateYamlFile).toHaveBeenCalledWith(
      'acme',
      'forms',
      'contact',
      formYaml,
      'Publish draft form',
      'draft',
      'github-token',
      'old-file-sha',
    );
  });
});
