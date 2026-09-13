import { ObjectId, type Db } from 'mongodb';
import type { IInternalForm } from '../types';
import { FormRepository } from './form.repository';

describe('FormRepository', () => {
  it('does not let MongoDB add persistence metadata to the caller form', async () => {
    const form = {
      sections: [],
      title: 'Smoke check',
    } as unknown as IInternalForm;
    const insertOne = jest.fn(async (document: IInternalForm) => {
      Object.assign(document, { _id: new ObjectId() });
    });
    const db = { collection: () => ({ insertOne }) } as unknown as Db;

    await new FormRepository(db).insert(form);

    expect(insertOne).toHaveBeenCalledTimes(1);
    expect(form).toEqual({ sections: [], title: 'Smoke check' });
  });
});
