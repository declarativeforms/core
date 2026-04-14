import type { ISubmission } from '@declarativeforms/types';
import type { Db } from 'mongodb';

export class SubmissionRepository {
  constructor(private db: Db) {}

  public async find(formId: string, id: string): Promise<ISubmission | null> {
    return this.db
      .collection<ISubmission>('submissions')
      .findOne({ id, form_id: formId });
  }

  public async findAll(formId: string): Promise<Array<ISubmission>> {
    return this.db
      .collection<ISubmission>('submissions')
      .find({ form_id: formId })
      .sort({ updated_at: -1, created_at: -1 })
      .toArray();
  }

  public async insert(submission: ISubmission): Promise<void> {
    await this.db.collection<ISubmission>('submissions').insertOne(submission);
  }

  public async update(formId: string, submission: ISubmission): Promise<void> {
    await this.db
      .collection<ISubmission>('submissions')
      .replaceOne({ id: submission.id, form_id: formId }, submission);
  }
}
