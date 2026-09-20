import type { ISubmission } from '@declarativeforms/engine';
import type { Db } from 'mongodb';

export class SubmissionRepository {
  constructor(private db: Db) {}

  public async ensureIndexes(): Promise<void> {
    await this.db
      .collection<ISubmission>('submissions')
      .createIndex({ form_id: 1, id: 1 });
    await this.db
      .collection<ISubmission>('submissions')
      .createIndex({ form_id: 1, status: 1, updated_at: 1, id: 1 });
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

  public findPageByFormIdAndStatus(
    formId: string,
    status: ISubmission['status'],
    page: number,
    limit: number,
  ): Promise<Array<ISubmission>> {
    return this.db
      .collection<ISubmission>('submissions')
      .find({ form_id: formId, status }, { projection: { _id: 0 } })
      .sort({ updated_at: 1, id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
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
