import type { IStudioForm } from '@declarativeforms/types';
import type { Db } from 'mongodb';

export class StudioFormRepository {
  constructor(private db: Db) {}

  public async delete(id: string): Promise<void> {
    await this.db.collection<IStudioForm>('studio_forms').deleteOne({ id });
  }

  public async find(id: string): Promise<IStudioForm | null> {
    return this.db
      .collection<IStudioForm>('studio_forms')
      .findOne({ id }, { projection: { _id: 0 } });
  }

  public async findAllByCollaborator(
    collaborator: string,
  ): Promise<Array<IStudioForm>> {
    return this.db
      .collection<IStudioForm>('studio_forms')
      .find({ collaborators: collaborator }, { projection: { _id: 0 } })
      .sort({ updated_at: -1, created_at: -1 })
      .toArray();
  }

  public async insert(studioForm: IStudioForm): Promise<IStudioForm> {
    await this.db.collection<IStudioForm>('studio_forms').insertOne(studioForm);

    return studioForm;
  }

  public async update(
    id: string,
    studioForm: IStudioForm,
  ): Promise<IStudioForm | null> {
    await this.db
      .collection<IStudioForm>('studio_forms')
      .replaceOne({ id }, studioForm);

    return studioForm;
  }
}
