import { randomBytes } from 'node:crypto';
import type { OrganizationRepository } from '../repositories';
import type {
  IOrganization,
  IOrganizationMember,
  IOrganizationRole,
} from '../types';

const ORGANIZATION_ID_PREFIX = 'o';
const PERSONAL_TAG = 'personal';
const PERSONAL_WORKSPACE_NAME = 'Personal workspace';
const SLUG_ATTEMPTS = 5;

export class OrganizationService {
  constructor(private organizationRepository: OrganizationRepository) {}

  public find(id: string): Promise<IOrganization | null> {
    return this.organizationRepository.findById(id);
  }

  public listByMember(emailAddress: string): Promise<Array<IOrganization>> {
    return this.organizationRepository.findAllByMemberEmailAddress(
      emailAddress,
    );
  }

  public async create(
    emailAddress: string,
    name: string,
    tags: Array<string>,
  ): Promise<IOrganization> {
    const now = new Date();

    for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt += 1) {
      const organization: IOrganization = {
        created_at: now,
        created_by: emailAddress,
        id: `${ORGANIZATION_ID_PREFIX}${randomBytes(6).toString('hex')}`,
        members: [{ email: emailAddress, role: 'admin' }],
        name,
        slug: this.buildSlug(name, attempt),
        tags,
        updated_at: now,
      };

      try {
        await this.organizationRepository.insert(organization);

        return organization;
      } catch (error: any) {
        if (
          error?.code !== 11000 ||
          error?.keyPattern?.created_by ||
          attempt === SLUG_ATTEMPTS - 1
        ) {
          throw error;
        }
      }
    }

    throw new Error('Could not allocate an organization slug');
  }

  public async ensurePersonalWorkspace(
    emailAddress: string,
  ): Promise<IOrganization | null> {
    const existing =
      await this.organizationRepository.findAllByMemberEmailAddress(
        emailAddress,
      );

    if (existing.length > 0) {
      return null;
    }

    try {
      return await this.create(emailAddress, PERSONAL_WORKSPACE_NAME, [
        PERSONAL_TAG,
      ]);
    } catch (error: any) {
      if (error?.code !== 11000 || !error?.keyPattern?.created_by) {
        throw error;
      }

      return this.organizationRepository.findByCreatedByAndTag(
        emailAddress,
        PERSONAL_TAG,
      );
    }
  }

  public async addMember(
    organization: IOrganization,
    actorEmailAddress: string,
    emailAddress: string,
    role: IOrganizationRole,
  ): Promise<boolean> {
    if (!this.isAdmin(organization, actorEmailAddress)) {
      return false;
    }

    const added = await this.organizationRepository.insertMember(
      organization.id,
      {
        email: emailAddress,
        role,
      },
    );

    if (!added) {
      await this.organizationRepository.setMemberRole(
        organization.id,
        emailAddress,
        role,
      );
    }

    return true;
  }

  public async removeMember(
    organization: IOrganization,
    actorEmailAddress: string,
    emailAddress: string,
  ): Promise<boolean> {
    if (!this.isAdmin(organization, actorEmailAddress)) {
      return false;
    }

    const remaining = organization.members.filter(
      (member) => member.email !== emailAddress,
    );

    if (!remaining.some((member) => member.role === 'admin')) {
      return false;
    }

    await this.organizationRepository.deleteMember(
      organization.id,
      emailAddress,
    );

    return true;
  }

  public findMember(
    organization: IOrganization,
    emailAddress: string,
  ): IOrganizationMember | null {
    return (
      organization.members.find((member) => member.email === emailAddress) ??
      null
    );
  }

  public isAdmin(organization: IOrganization, emailAddress: string): boolean {
    return this.findMember(organization, emailAddress)?.role === 'admin';
  }

  private buildSlug(name: string, attempt: number): string {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'org';

    return attempt === 0 ? base : `${base}-${randomBytes(2).toString('hex')}`;
  }
}
