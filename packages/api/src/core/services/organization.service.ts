import { randomBytes } from 'node:crypto';
import { z } from 'zod';
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

  public listByMember(emailAddress: string): Promise<Array<IOrganization>> {
    return this.organizationRepository.findAllByMember(
      emailAddress.trim().toLowerCase(),
    );
  }

  public findByMember(
    id: string,
    emailAddress: string,
  ): Promise<IOrganization | null> {
    return this.organizationRepository.findByIdAndMember(
      id,
      emailAddress.trim().toLowerCase(),
    );
  }

  public async addMember(
    id: string,
    adminEmailAddress: string,
    emailAddress: string,
    role: IOrganizationRole,
  ): Promise<IOrganizationMember | null> {
    const member = {
      email: z.email().parse(emailAddress.trim().toLowerCase()),
      role: z.enum(['admin', 'member']).parse(role),
    };
    const organization = await this.organizationRepository.setMember(
      id,
      adminEmailAddress.trim().toLowerCase(),
      member,
    );

    return (
      organization?.members.find((entry) => entry.email === member.email) ??
      null
    );
  }

  public async ensurePersonalWorkspace(
    emailAddress: string,
  ): Promise<IOrganization> {
    const existing = await this.organizationRepository.findByCreatedByAndTag(
      emailAddress,
      PERSONAL_TAG,
    );

    if (existing) {
      return existing;
    }

    try {
      return await this.create(emailAddress, PERSONAL_WORKSPACE_NAME, [
        PERSONAL_TAG,
      ]);
    } catch (error: any) {
      if (error?.code !== 11000 || !error?.keyPattern?.created_by) {
        throw error;
      }

      const created = await this.organizationRepository.findByCreatedByAndTag(
        emailAddress,
        PERSONAL_TAG,
      );

      if (!created) {
        throw new Error('Could not load the personal workspace');
      }

      return created;
    }
  }

  private async create(
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
