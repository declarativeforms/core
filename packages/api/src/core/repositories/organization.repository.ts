import type { Db } from 'mongodb';
import type { IOrganization } from '../types';

export class OrganizationRepository {
  constructor(private db: Db) {}

  public async ensureIndexes(): Promise<void> {
    await this.db
      .collection<IOrganization>('organizations')
      .createIndex({ id: 1 }, { unique: true });
    await this.db
      .collection<IOrganization>('organizations')
      .createIndex({ slug: 1 }, { unique: true });
    await this.db.collection<IOrganization>('organizations').createIndex(
      { created_by: 1 },
      {
        partialFilterExpression: { tags: 'personal' },
        unique: true,
      },
    );
  }

  public findByCreatedByAndTag(
    createdByEmailAddress: string,
    tag: string,
  ): Promise<IOrganization | null> {
    return this.db
      .collection<IOrganization>('organizations')
      .findOne({ created_by: createdByEmailAddress, tags: tag } as any, {
        projection: { _id: 0 },
      });
  }

  public async insert(organization: IOrganization): Promise<void> {
    await this.db
      .collection<IOrganization>('organizations')
      .insertOne(organization);
  }
}
