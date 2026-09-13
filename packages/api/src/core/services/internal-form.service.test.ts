import type { IDeclarativeForm } from '@declarativeforms/engine';
import type { ValidateFunction } from 'ajv';
import type { FormRepository } from '../repositories';
import type { IInternalForm } from '../types';
import { InternalFormService } from './internal-form.service';

describe('InternalFormService', () => {
  it('creates, updates, and publishes a draft without deleting it', async () => {
    let main = {
      branch: 'main',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      created_by: 'owner@example.com',
      deleted_at: null,
      form_id: 'i1',
      name: 'Feedback',
      organization_id: 'o1',
      revision: 1,
      sections: [],
      title: 'Original',
      updated_at: new Date('2026-01-01T00:00:00.000Z'),
      updated_by: 'owner@example.com',
    } as unknown as IInternalForm;
    let draft: IInternalForm | null = null;
    const formRepository = {
      findByIdAndBranch: jest.fn((_id: string, branch: string) =>
        Promise.resolve(branch === 'main' ? main : draft),
      ),
      insert: jest.fn((form: IInternalForm) => {
        draft = form;

        return Promise.resolve();
      }),
      replace: jest.fn((form: IInternalForm) => {
        if (form.branch === 'main') {
          main = form;
        } else {
          draft = form;
        }

        return Promise.resolve(true);
      }),
    } as unknown as FormRepository;
    const service = new InternalFormService(
      formRepository,
      jest.fn() as unknown as ValidateFunction,
    );

    const created = await service.createBranch(
      'o1',
      'owner@example.com',
      'i1',
      'new-copy',
      'main',
    );
    const updated = await service.update(
      'o1',
      'owner@example.com',
      'i1',
      'new-copy',
      { sections: [], title: 'Updated' } as unknown as IDeclarativeForm,
      null,
    );
    const published = await service.publish(
      'o1',
      'owner@example.com',
      'i1',
      'new-copy',
    );

    expect(created?.branch).toBe('new-copy');
    expect(updated?.title).toBe('Updated');
    expect(published).toMatchObject({
      branch: 'main',
      revision: 2,
      title: 'Updated',
    });
    expect(draft).toMatchObject({ branch: 'new-copy', title: 'Updated' });
    expect(formRepository.replace).toHaveBeenLastCalledWith(
      expect.objectContaining({ branch: 'main', title: 'Updated' }),
      1,
    );
  });
});
