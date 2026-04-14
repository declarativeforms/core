import type { IDeclarativeForm } from '@declarativeforms/types';
import { FormService } from './form.service';

function createFormService() {
  const gitHubFileRepository = {
    find: jest.fn(),
    upsert: jest.fn(),
  };
  const studioFormRepository = {
    find: jest.fn(),
  };
  const connectionRecordRepository = {
    find: jest.fn(),
  };
  const gitHubGateway = {
    retrieveYamlFile: jest.fn(),
  };

  const service = new FormService(
    gitHubFileRepository as any,
    studioFormRepository as any,
    connectionRecordRepository as any,
    gitHubGateway as any,
  );

  return {
    service,
    gitHubFileRepository,
    studioFormRepository,
    connectionRecordRepository,
    gitHubGateway,
  };
}

describe('FormService', () => {
  test('findById resolves studio forms from the id prefix', async () => {
    const { service, studioFormRepository, gitHubFileRepository } =
      createFormService();
    const form: IDeclarativeForm = { id: 'b12345678', title: 'Studio form' };
    studioFormRepository.find.mockResolvedValue(form);

    const result = await service.findById('b12345678');

    expect(result).toEqual(form);
    expect(studioFormRepository.find).toHaveBeenCalledWith('b12345678');
    expect(gitHubFileRepository.find).not.toHaveBeenCalled();
  });

  test('findById resolves github forms from github_files', async () => {
    const { service, gitHubFileRepository, gitHubGateway } = createFormService();
    gitHubFileRepository.find.mockResolvedValue({
      file: 'forms/contact',
      id: 'a12345678',
      owner: 'acme',
      repository: 'website',
    });
    gitHubGateway.retrieveYamlFile.mockResolvedValue('title: GitHub form');

    const result = await service.findById('a12345678');

    expect(result).toEqual({
      id: 'a12345678',
      title: 'GitHub form',
    });
    expect(gitHubGateway.retrieveYamlFile).toHaveBeenCalledWith(
      'acme',
      'website',
      'forms/contact',
    );
  });

  test('findById rejects ids without a known prefix', async () => {
    const { service, studioFormRepository, gitHubFileRepository } =
      createFormService();

    const result = await service.findById('12345678');

    expect(result).toBeNull();
    expect(studioFormRepository.find).not.toHaveBeenCalled();
    expect(gitHubFileRepository.find).not.toHaveBeenCalled();
  });

  test('findBySlug returns a github-prefixed id and stores the mapping', async () => {
    const { service, gitHubFileRepository, gitHubGateway } = createFormService();
    gitHubGateway.retrieveYamlFile.mockResolvedValue('title: Contact');

    const result = await service.findBySlug('forms/acme/website/contact');

    expect(result).toEqual({
      id: expect.stringMatching(/^a[a-f0-9]{8}$/),
      title: 'Contact',
    });
    expect(gitHubFileRepository.upsert).toHaveBeenCalledWith({
      file: 'contact',
      id: expect.stringMatching(/^a[a-f0-9]{8}$/),
      owner: 'acme',
      repository: 'website',
    });
  });
});
