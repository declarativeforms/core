import type { IDeclarativeForm } from '@declarativeforms/types';
import { getContainer } from '../container';

export async function findStudioForm(
  id: string,
): Promise<IDeclarativeForm | null> {
  const container = await getContainer();

  return container.db
    .collection<IDeclarativeForm>('studio_forms')
    .findOne({ id }, { projection: { _id: 0 } });
}

export async function findStudioForms(): Promise<Array<IDeclarativeForm>> {
  const container = await getContainer();

  return container.db
    .collection<IDeclarativeForm>('studio_forms')
    .find({}, { projection: { _id: 0 } })
    .sort({ updated_at: -1, created_at: -1 })
    .toArray();
}

export async function insertStudioForm(form: IDeclarativeForm): Promise<void> {
  const container = await getContainer();

  await container.db
    .collection<IDeclarativeForm>('studio_forms')
    .insertOne(form);
}

export async function replaceStudioForm(
  id: string,
  form: IDeclarativeForm,
): Promise<boolean> {
  const container = await getContainer();

  const result = await container.db
    .collection<IDeclarativeForm>('studio_forms')
    .replaceOne({ id }, form);

  return result.matchedCount > 0;
}

export async function deleteStudioForm(id: string): Promise<boolean> {
  const container = await getContainer();

  const result = await container.db
    .collection<IDeclarativeForm>('studio_forms')
    .deleteOne({ id });

  return result.deletedCount > 0;
}
