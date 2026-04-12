import type { IStudioForm } from '@declarativeforms/types';
import { getContainer } from '../container';

export async function findStudioForm(
  id: string,
): Promise<IStudioForm | null> {
  const container = await getContainer();

  return container.db
    .collection<IStudioForm>('studio_forms')
    .findOne({ id }, { projection: { _id: 0 } });
}

export async function findStudioForms(
  email?: string | null,
): Promise<Array<IStudioForm>> {
  const container = await getContainer();

  const filter = email ? { collaborators: email } : {};

  return container.db
    .collection<IStudioForm>('studio_forms')
    .find(filter, { projection: { _id: 0 } })
    .sort({ updated_at: -1, created_at: -1 })
    .toArray();
}

export async function insertStudioForm(form: IStudioForm): Promise<void> {
  const container = await getContainer();

  await container.db
    .collection<IStudioForm>('studio_forms')
    .insertOne(form);
}

export async function replaceStudioForm(
  id: string,
  form: IStudioForm,
): Promise<boolean> {
  const container = await getContainer();

  const result = await container.db
    .collection<IStudioForm>('studio_forms')
    .replaceOne({ id }, form);

  return result.matchedCount > 0;
}

export async function deleteStudioForm(id: string): Promise<boolean> {
  const container = await getContainer();

  const result = await container.db
    .collection<IStudioForm>('studio_forms')
    .deleteOne({ id });

  return result.deletedCount > 0;
}
