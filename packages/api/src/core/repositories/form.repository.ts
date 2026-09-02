import type { IDeclarativeForm } from '@declarativeforms/engine';
import type { Db } from 'mongodb';
import { INTERNAL_FORM_METADATA_KEYS, type IInternalForm } from '../types';

const PUBLIC_PROJECTION = {
  _id: 0,
  ...Object.fromEntries(
    INTERNAL_FORM_METADATA_KEYS.map((key) => [key, 0] as const),
  ),
};

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

  public async findDefinition(
    id: string,
    branch: string,
  ): Promise<IDeclarativeForm | null> {
    const document = await this.db
      .collection<IInternalForm>('forms')
      .findOne({ branch, deleted_at: null, form_id: id } as any, {
        projection: PUBLIC_PROJECTION,
      });

    return document ? { ...(document as IDeclarativeForm), id } : null;
  }

  public async findBranch(
    id: string,
    branch: string,
  ): Promise<IInternalForm | null> {
    return this.db
      .collection<IInternalForm>('forms')
      .findOne({ branch, deleted_at: null, form_id: id } as any, {
        projection: { _id: 0 },
      }) as Promise<IInternalForm | null>;
  }

  public async findAnyBranch(id: string): Promise<IInternalForm | null> {
    return this.db
      .collection<IInternalForm>('forms')
      .findOne({ deleted_at: null, form_id: id } as any, {
        projection: { _id: 0 },
      }) as Promise<IInternalForm | null>;
  }

  public async findBranchNames(id: string): Promise<Array<string>> {
    const documents = await this.db
      .collection<IInternalForm>('forms')
      .find({ deleted_at: null, form_id: id } as any, {
        projection: { _id: 0, branch: 1 },
      })
      .toArray();

    return documents.map((document) => document.branch).sort();
  }

  public async listByOrganization(
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

  public async delete(id: string, branch: string): Promise<boolean> {
    const result = await this.db
      .collection<IInternalForm>('forms')
      .deleteOne({ branch, form_id: id } as any);

    return result.deletedCount > 0;
  }

  public async softDelete(id: string, at: Date): Promise<boolean> {
    const result = await this.db.collection<IInternalForm>('forms').updateMany(
      { deleted_at: null, form_id: id } as any,
      {
        $set: { deleted_at: at },
      } as any,
    );

    return result.modifiedCount > 0;
  }
}
