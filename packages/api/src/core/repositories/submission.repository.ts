import type { ISubmission } from '@declarativeforms/engine';
import type { Db } from 'mongodb';

export class SubmissionRepository {
  constructor(private db: Db) {}

  public async ensureIndexes(): Promise<void> {
    await this.db
      .collection<ISubmission>('submissions')
      .createIndex({ form_id: 1, id: 1 });
  }

  public findByFormIdAndSubmissionId(
    formId: string,
    submissionId: string,
  ): Promise<ISubmission | null> {
    return this.db
      .collection<ISubmission>('submissions')
      .findOne(
        { id: submissionId, form_id: formId },
        { projection: { _id: 0 } },
      );
  }

  public async insert(submission: ISubmission): Promise<void> {
    await this.db.collection<ISubmission>('submissions').insertOne(submission);
  }

  public async replace(submission: ISubmission): Promise<void> {
    await this.db
      .collection<ISubmission>('submissions')
      .replaceOne(
        { id: submission.id, form_id: submission.form_id },
        submission,
      );
  }
}
