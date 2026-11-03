import type { IDeclarativeForm } from '@declarativeforms/engine';
import type { Db } from 'mongodb';
import type { IStoredForm } from '../types';

export class FormRepository {
  constructor(private db: Db) {}

  public async ensureIndexes(): Promise<void> {
    await this.db.collection('forms').createIndex({ id: 1 }, { unique: true });
  }

  public findById(id: string): Promise<IStoredForm | null> {
    return this.db
      .collection<IStoredForm>('forms')
      .findOne({ id }, { projection: { _id: 0 } });
  }

  public findByOwnerAndId(
    ownerId: string,
    id: string,
  ): Promise<IStoredForm | null> {
    return this.db
      .collection<IStoredForm>('forms')
      .findOne({ ownerId, id }, { projection: { _id: 0 } });
  }

  public findAllByOwner(ownerId: string): Promise<Array<IStoredForm>> {
    return this.db
      .collection<IStoredForm>('forms')
      .find({ ownerId }, { projection: { _id: 0 } })
      .toArray();
  }

  public async insert(form: IStoredForm): Promise<IStoredForm | null> {
    const result = await this.db
      .collection<IStoredForm>('forms')
      .updateOne({ id: form.id }, { $setOnInsert: form }, { upsert: true });

    return result.upsertedCount === 1 ? form : null;
  }

  public setDefinition(
    ownerId: string,
    id: string,
    definition: IDeclarativeForm,
  ): Promise<IStoredForm | null> {
    return this.db
      .collection<IStoredForm>('forms')
      .findOneAndUpdate(
        { ownerId, id },
        { $set: { definition } },
        { returnDocument: 'after', projection: { _id: 0 } },
      );
  }
}
