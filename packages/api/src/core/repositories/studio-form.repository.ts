import type { IStudioForm } from '@declarativeforms/types';
import type { Db } from 'mongodb';

export class StudioFormRepository {
  constructor(private db: Db) {}

  public async delete(id: string): Promise<boolean> {
    const result = await this.db
      .collection<IStudioForm>('studio_forms')
      .deleteOne({ id });

    return result.deletedCount > 0;
  }

  public async find(id: string): Promise<IStudioForm | null> {
    return this.db
      .collection<IStudioForm>('studio_forms')
      .findOne({ id }, { projection: { _id: 0 } });
  }

  public async findAllByCollaborator(
    email: string,
  ): Promise<Array<IStudioForm>> {
    return this.db
      .collection<IStudioForm>('studio_forms')
      .find(
        { collaborators: email },
        { projection: { _id: 0 } },
      )
      .sort({ updated_at: -1, created_at: -1 })
      .toArray();
  }

  public async insert(form: IStudioForm): Promise<IStudioForm> {
    await this.db.collection<IStudioForm>('studio_forms').insertOne(form);

    return form;
  }

  public async update(
    id: string,
    form: IStudioForm,
  ): Promise<IStudioForm | null> {
    const result = await this.db
      .collection<IStudioForm>('studio_forms')
      .replaceOne({ id }, form);

    return result.matchedCount > 0 ? form : null;
  }
}
