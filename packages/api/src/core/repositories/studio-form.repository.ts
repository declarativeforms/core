import type { IDeclarativeForm } from '@declarativeforms/types';
import type { Db } from 'mongodb';

export class StudioFormRepository {
  constructor(private db: Db) {}

  public async delete(id: string): Promise<boolean> {
    const result = await this.db
      .collection<IDeclarativeForm>('studio_forms')
      .deleteOne({ id });

    return result.deletedCount > 0;
  }

  public async find(id: string): Promise<IDeclarativeForm | null> {
    return this.db
      .collection<IDeclarativeForm>('studio_forms')
      .findOne({ id }, { projection: { _id: 0 } });
  }

  public async findAll(): Promise<Array<IDeclarativeForm>> {
    return this.db
      .collection<IDeclarativeForm>('studio_forms')
      .find({}, { projection: { _id: 0 } })
      .sort({ updated_at: -1, created_at: -1 })
      .toArray();
  }

  public async insert(form: IDeclarativeForm): Promise<IDeclarativeForm> {
    await this.db.collection<IDeclarativeForm>('studio_forms').insertOne(form);

    return form;
  }

  public async update(
    id: string,
    form: IDeclarativeForm,
  ): Promise<IDeclarativeForm | null> {
    const result = await this.db
      .collection<IDeclarativeForm>('studio_forms')
      .replaceOne({ id }, form);

    return result.matchedCount > 0 ? form : null;
  }
}
