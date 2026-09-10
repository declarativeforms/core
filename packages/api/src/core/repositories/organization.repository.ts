import type { Db } from 'mongodb';
import type {
  IOrganization,
  IOrganizationMember,
  IOrganizationRole,
} from '../types';

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

  public findById(id: string): Promise<IOrganization | null> {
    return this.db
      .collection<IOrganization>('organizations')
      .findOne({ id }, { projection: { _id: 0 } });
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

  public findAllByMemberEmailAddress(
    emailAddress: string,
  ): Promise<Array<IOrganization>> {
    return this.db
      .collection<IOrganization>('organizations')
      .find({ 'members.email': emailAddress }, { projection: { _id: 0 } })
      .sort({ created_at: 1 })
      .toArray();
  }

  public async insert(organization: IOrganization): Promise<void> {
    await this.db
      .collection<IOrganization>('organizations')
      .insertOne(organization);
  }

  public async insertMember(
    id: string,
    member: IOrganizationMember,
  ): Promise<boolean> {
    const result = await this.db
      .collection<IOrganization>('organizations')
      .updateOne(
        { id, 'members.email': { $ne: member.email } },
        { $push: { members: member }, $set: { updated_at: new Date() } },
      );

    return result.matchedCount > 0;
  }

  public async setMemberRole(
    id: string,
    emailAddress: string,
    role: IOrganizationRole,
  ): Promise<boolean> {
    const result = await this.db
      .collection<IOrganization>('organizations')
      .updateOne(
        { id, 'members.email': emailAddress },
        { $set: { 'members.$.role': role, updated_at: new Date() } },
      );

    return result.matchedCount > 0;
  }

  public async deleteMember(
    id: string,
    emailAddress: string,
  ): Promise<boolean> {
    const result = await this.db
      .collection<IOrganization>('organizations')
      .updateOne(
        { id },
        {
          $pull: { members: { email: emailAddress } },
          $set: { updated_at: new Date() },
        },
      );

    return result.modifiedCount > 0;
  }
}
