import type { ISubmission } from '@declarativeforms/types';
import { getContainer } from '../container';

export async function findSubmission(
  formId: string,
  submissionId: string,
): Promise<ISubmission | null> {
  const container = await getContainer();

  return container.db
    .collection<ISubmission>('submissions')
    .findOne({ id: submissionId, form_id: formId });
}

export async function findSubmissions(formId: string): Promise<Array<ISubmission>> {
  const container = await getContainer();

  return container.db
    .collection<ISubmission>('submissions')
    .find({ form_id: formId })
    .toArray();
}

export async function insertSubmission(submission: ISubmission): Promise<void> {
  const container = await getContainer();

  await container.db.collection<ISubmission>('submissions').insertOne(submission);
}

export async function replaceSubmission(
  formId: string,
  submissionId: string,
  submission: ISubmission,
): Promise<void> {
  const container = await getContainer();

  await container.db
    .collection<ISubmission>('submissions')
    .replaceOne({ id: submissionId, form_id: formId }, submission);
}
