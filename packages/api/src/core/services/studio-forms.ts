import { faker } from '@faker-js/faker';
import type { IDeclarativeForm } from '@declarativeforms/types';
import {
  deleteForm,
  deleteStudioForm,
  findStudioForm,
  findStudioForms,
  insertStudioForm,
  replaceStudioForm,
  upsertForm,
} from '../repositories';

async function generateStudioFormId(): Promise<string> {
  while (true) {
    const id = faker.string.alphanumeric({ casing: 'lower', length: 8 });
    const existing = await findStudioForm(id);

    if (!existing) {
      return id;
    }
  }
}

export async function listStudioForms(): Promise<Array<IDeclarativeForm>> {
  return findStudioForms();
}

export async function createStudioForm(
  form: IDeclarativeForm,
): Promise<IDeclarativeForm> {
  const now = new Date().toISOString();
  const id = await generateStudioFormId();
  const nextForm: IDeclarativeForm = {
    ...form,
    id,
    created_at: now,
    updated_at: now,
  };

  await insertStudioForm(nextForm);

  await upsertForm({
    id,
    source: 'studio',
    owner: '',
    repository: '',
    file: '',
  });

  return nextForm;
}

export async function findStudioFormById(
  id: string,
): Promise<IDeclarativeForm | null> {
  return findStudioForm(id);
}

export async function updateStudioFormById(
  id: string,
  form: IDeclarativeForm,
): Promise<IDeclarativeForm | null> {
  const existing = await findStudioForm(id);

  if (!existing) {
    return null;
  }

  const nextForm: IDeclarativeForm = {
    ...form,
    id,
    created_at: existing.created_at,
    updated_at: new Date().toISOString(),
  };

  await replaceStudioForm(id, nextForm);

  return nextForm;
}

export async function deleteStudioFormById(id: string): Promise<boolean> {
  const deleted = await deleteStudioForm(id);

  if (deleted) {
    await deleteForm(id);
  }

  return deleted;
}
