import type { Db } from 'mongodb';
import type { ManagedForm } from '../types';

export class FormRepository {
  constructor(private db: Db) {}

  public async delete(id: string): Promise<boolean> {
    const result = await this.db
      .collection<ManagedForm>('forms')
      .deleteOne({ id });

    return result.deletedCount === 1;
  }

  public async find(id: string): Promise<ManagedForm | null> {
    return this.db
      .collection<ManagedForm>('forms')
      .findOne({ id }, { projection: { _id: 0 } });
  }

  public async findAll(): Promise<Array<ManagedForm>> {
    return this.db
      .collection<ManagedForm>('forms')
      .find({}, { projection: { _id: 0 } })
      .sort({ updated_at: -1, created_at: -1 })
      .toArray();
  }

  public async insert(form: ManagedForm): Promise<ManagedForm> {
    await this.db.collection<ManagedForm>('forms').insertOne({ ...form });

    return form;
  }

  public async update(
    id: string,
    form: ManagedForm,
  ): Promise<ManagedForm | null> {
    const result = await this.db
      .collection<ManagedForm>('forms')
      .replaceOne({ id }, form);

    return result.matchedCount === 1 ? form : null;
  }
}
