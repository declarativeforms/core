import type { IDeclarativeForm } from '@declarativeforms/types';
import { StudioFormService } from './studio-form.service';

function createStudioFormService() {
  const studioFormRepository = {
    delete: jest.fn(),
    findAll: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  };
  const formService = {
    findById: jest.fn(),
  };

  const service = new StudioFormService(
    studioFormRepository as any,
    formService as any,
  );

  return {
    service,
    studioFormRepository,
    formService,
  };
}

describe('StudioFormService', () => {
  test('create stores studio forms with a b-prefixed id', async () => {
    const { service, studioFormRepository } = createStudioFormService();
    const form: IDeclarativeForm = { title: 'Studio form' };

    const result = await service.create(form);

    expect(result.id).toMatch(/^b[a-z0-9]{8}$/);
    expect(studioFormRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^b[a-z0-9]{8}$/),
        title: 'Studio form',
      }),
    );
  });

  test('update rejects non-studio ids', async () => {
    const { service, formService, studioFormRepository } =
      createStudioFormService();

    const result = await service.update('a12345678', { title: 'Ignored' });

    expect(result).toBeNull();
    expect(formService.findById).not.toHaveBeenCalled();
    expect(studioFormRepository.update).not.toHaveBeenCalled();
  });

  test('delete rejects non-studio ids', async () => {
    const { service, studioFormRepository } = createStudioFormService();

    const result = await service.delete('a12345678');

    expect(result).toBe(false);
    expect(studioFormRepository.delete).not.toHaveBeenCalled();
  });
});
