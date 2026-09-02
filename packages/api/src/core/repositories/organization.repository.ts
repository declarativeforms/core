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
  }

  public async find(id: string): Promise<IOrganization | null> {
    return this.db
      .collection<IOrganization>('organizations')
      .findOne({ id }, { projection: { _id: 0 } });
  }

  public async listByMember(email: string): Promise<Array<IOrganization>> {
    return this.db
      .collection<IOrganization>('organizations')
      .find({ 'members.email': email }, { projection: { _id: 0 } })
      .sort({ created_at: 1 })
      .toArray();
  }

  public async insert(organization: IOrganization): Promise<void> {
    await this.db
      .collection<IOrganization>('organizations')
      .insertOne(organization);
  }

  public async addMember(
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
    email: string,
    role: IOrganizationRole,
  ): Promise<boolean> {
    const result = await this.db
      .collection<IOrganization>('organizations')
      .updateOne(
        { id, 'members.email': email },
        { $set: { 'members.$.role': role, updated_at: new Date() } },
      );

    return result.matchedCount > 0;
  }

  public async removeMember(id: string, email: string): Promise<boolean> {
    const result = await this.db
      .collection<IOrganization>('organizations')
      .updateOne(
        { id },
        {
          $pull: { members: { email } },
          $set: { updated_at: new Date() },
        },
      );

    return result.modifiedCount > 0;
  }
}
