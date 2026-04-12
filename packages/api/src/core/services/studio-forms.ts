import { faker } from '@faker-js/faker';
import type { IDeclarativeForm, IStudioForm } from '@declarativeforms/types';
import {
  deleteForm,
  deleteStudioForm,
  findForm,
  findStudioForm,
  findStudioForms,
  insertStudioForm,
  replaceStudioForm,
  upsertForm,
} from '../repositories';

async function generateStudioFormId(): Promise<string> {
  while (true) {
    const id = faker.string.alphanumeric({ casing: 'lower', length: 8 });
    const existing = await findForm(id);

    if (!existing) {
      return id;
    }
  }
}

export async function listStudioForms(
  email?: string | null,
): Promise<Array<IStudioForm>> {
  if (!email) {
    return [];
  }
  return findStudioForms(email);
}

export async function createStudioForm(
  form: IDeclarativeForm,
  creatorEmail: string,
): Promise<IStudioForm> {
  const now = new Date().toISOString();
  const id = await generateStudioFormId();
  const nextForm: IStudioForm = {
    ...form,
    id,
    created_at: now,
    updated_at: now,
    collaborators: [creatorEmail],
  };

  await insertStudioForm(nextForm);

  await upsertForm({
    id,
    source: 'studio',
  });

  return nextForm;
}

export async function updateStudioFormById(
  id: string,
  form: IDeclarativeForm & { collaborators?: string[] },
  actorEmail: string | null,
): Promise<IStudioForm> {
  const existing = await findStudioForm(id);

  if (!existing) {
    throw new Error(`Studio form not found: ${id}`);
  }

  if (!actorEmail || !existing.collaborators.includes(actorEmail)) {
    throw new Error(`Not authorized to update studio form: ${id}`);
  }

  const nextForm: IStudioForm = {
    ...form,
    id,
    created_at: existing.created_at,
    updated_at: new Date().toISOString(),
    collaborators: form.collaborators ?? existing.collaborators,
  };

  await replaceStudioForm(id, nextForm);

  return nextForm;
}

export async function deleteStudioFormById(
  id: string,
  actorEmail: string | null,
): Promise<void> {
  const existing = await findStudioForm(id);

  if (!existing) {
    throw new Error(`Studio form not found: ${id}`);
  }

  if (!actorEmail || !existing.collaborators.includes(actorEmail)) {
    throw new Error(`Not authorized to delete studio form: ${id}`);
  }

  await deleteStudioForm(id);
  await deleteForm(id);
}
