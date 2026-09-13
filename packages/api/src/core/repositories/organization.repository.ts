import type { Db } from 'mongodb';
import type { IOrganization, IOrganizationMember } from '../types';

export class OrganizationRepository {
  constructor(private db: Db) {}

  public async ensureIndexes(): Promise<void> {
    await this.db
      .collection<IOrganization>('organizations')
      .createIndex({ id: 1 }, { unique: true });
    await this.db
      .collection<IOrganization>('organizations')
      .createIndex({ slug: 1 }, { unique: true });
    await this.db
      .collection<IOrganization>('organizations')
      .createIndex({ 'members.email': 1 });
    await this.db.collection<IOrganization>('organizations').createIndex(
      { created_by: 1 },
      {
        partialFilterExpression: { tags: 'personal' },
        unique: true,
      },
    );
  }

  public findByIdAndMember(
    id: string,
    emailAddress: string,
  ): Promise<IOrganization | null> {
    return this.db
      .collection<IOrganization>('organizations')
      .findOne(
        { id, 'members.email': emailAddress },
        { projection: { _id: 0 } },
      );
  }

  public findAllByMember(emailAddress: string): Promise<Array<IOrganization>> {
    return this.db
      .collection<IOrganization>('organizations')
      .find({ 'members.email': emailAddress }, { projection: { _id: 0 } })
      .sort({ name: 1, id: 1 })
      .toArray();
  }

  public setMember(
    id: string,
    adminEmailAddress: string,
    member: IOrganizationMember,
  ): Promise<IOrganization | null> {
    return this.db.collection<IOrganization>('organizations').findOneAndUpdate(
      {
        id,
        members: { $elemMatch: { email: adminEmailAddress, role: 'admin' } },
      },
      [
        {
          $set: {
            members: {
              $cond: [
                { $in: [{ $literal: member.email }, '$members.email'] },
                '$members',
                { $concatArrays: ['$members', { $literal: [member] }] },
              ],
            },
            updated_at: {
              $cond: [
                { $in: [{ $literal: member.email }, '$members.email'] },
                '$updated_at',
                '$$NOW',
              ],
            },
          },
        },
      ],
      { projection: { _id: 0 }, returnDocument: 'after' },
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
