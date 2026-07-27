import type { IDeclarativeForm } from '@declarativeforms/core';
import type { FormRepository } from '../repositories';
import type { ManagedForm } from '../types';
import { ManagedFormService } from './managed-form.service';

const definition: IDeclarativeForm = {
  title: 'Contact us',
  sections: [
    {
      id: 'contact',
      fields: [{ id: 'email', type: 'email' }],
    },
  ],
};

describe('ManagedFormService', () => {
  test('creates an f-prefixed form and ignores supplied metadata', async () => {
    let inserted: ManagedForm | null = null;
    const repository = {
      insert: async (form: ManagedForm) => {
        inserted = form;
        return form;
      },
    } as unknown as FormRepository;
    const service = new ManagedFormService(repository);

    const form = await service.create({
      ...definition,
      id: 'b-old-studio-id',
      created_at: 'not-from-client',
    });

    expect(form.id).toMatch(/^f[0-9a-f]{12}$/);
    expect(form.created_at).not.toBe('not-from-client');
    expect(inserted).toEqual(form);
  });

  test('preserves the creation timestamp during replacement', async () => {
    const existing: ManagedForm = {
      ...definition,
      id: 'f123456789abc',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };
    let replacement: ManagedForm | null = null;
    const repository = {
      find: async () => existing,
      update: async (_id: string, form: ManagedForm) => {
        replacement = form;
        return form;
      },
    } as unknown as FormRepository;
    const service = new ManagedFormService(repository);

    const result = await service.update(existing.id, {
      ...definition,
      title: 'Updated',
      id: 'client-id',
      created_at: 'client-created-at',
    });

    expect(result?.id).toBe(existing.id);
    expect(result?.created_at).toBe(existing.created_at);
    expect(result?.title).toBe('Updated');
    expect(replacement).toEqual(result);
  });
});
