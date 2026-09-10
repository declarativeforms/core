import type { Db } from 'mongodb';
import type { IInternalForm } from '../types';

export class FormRepository {
  constructor(private db: Db) {}

  public async ensureIndexes(): Promise<void> {
    await this.db
      .collection<IInternalForm>('forms')
      .createIndex({ form_id: 1, branch: 1 }, { unique: true });
    await this.db
      .collection<IInternalForm>('forms')
      .createIndex({ organization_id: 1, updated_at: -1 });
  }

  public findByIdAndBranch(
    id: string,
    branch: string,
  ): Promise<IInternalForm | null> {
    return this.db
      .collection<IInternalForm>('forms')
      .findOne({ branch, deleted_at: null, form_id: id } as any, {
        projection: { _id: 0 },
      }) as Promise<IInternalForm | null>;
  }

  public findById(id: string): Promise<IInternalForm | null> {
    return this.db
      .collection<IInternalForm>('forms')
      .findOne({ deleted_at: null, form_id: id } as any, {
        projection: { _id: 0 },
      }) as Promise<IInternalForm | null>;
  }

  public async findAllBranchNamesById(id: string): Promise<Array<string>> {
    const documents = await this.db
      .collection<IInternalForm>('forms')
      .find({ deleted_at: null, form_id: id } as any, {
        projection: { _id: 0, branch: 1 },
      })
      .toArray();

    return documents.map((document) => document.branch).sort();
  }

  public findAllByOrganizationIdAndBranch(
    organizationId: string,
    branch: string,
  ): Promise<Array<IInternalForm>> {
    return this.db
      .collection<IInternalForm>('forms')
      .find(
        { branch, deleted_at: null, organization_id: organizationId } as any,
        { projection: { _id: 0 } },
      )
      .sort({ updated_at: -1 })
      .limit(200)
      .toArray() as Promise<Array<IInternalForm>>;
  }

  public async insert(form: IInternalForm): Promise<void> {
    await this.db.collection<IInternalForm>('forms').insertOne(form as any);
  }

  public async replace(
    form: IInternalForm,
    expectedRevision: number | null,
  ): Promise<boolean> {
    const filter: Record<string, unknown> = {
      branch: form.branch,
      deleted_at: null,
      form_id: form.form_id,
    };

    if (expectedRevision !== null) {
      filter.revision = expectedRevision;
    }

    const result = await this.db
      .collection<IInternalForm>('forms')
      .replaceOne(filter as any, form as any);

    return result.matchedCount > 0;
  }

  public async deleteByIdAndBranch(id: string, branch: string): Promise<void> {
    await this.db
      .collection<IInternalForm>('forms')
      .deleteOne({ branch, form_id: id } as any);
  }

  public async setName(
    id: string,
    name: string,
    emailAddress: string,
  ): Promise<void> {
    await this.db.collection<IInternalForm>('forms').updateMany(
      { deleted_at: null, form_id: id } as any,
      {
        $set: { name, updated_at: new Date(), updated_by: emailAddress },
      } as any,
    );
  }

  public async setDeletedAt(id: string): Promise<void> {
    await this.db.collection<IInternalForm>('forms').updateMany(
      { deleted_at: null, form_id: id } as any,
      {
        $set: { deleted_at: new Date() },
      } as any,
    );
  }
}
