import { randomBytes } from 'node:crypto';
import { HttpError } from '../errors';
import type { OrganizationRepository } from '../repositories';
import type {
  IOrganization,
  IOrganizationMember,
  IOrganizationRole,
} from '../types';

const ORGANIZATION_ID_PREFIX = 'o';
const SLUG_ATTEMPTS = 5;

export class OrganizationService {
  constructor(private organizationRepository: OrganizationRepository) {}

  public async ensureIndexes(): Promise<void> {
    await this.organizationRepository.ensureIndexes();
  }

  public async find(id: string): Promise<IOrganization | null> {
    return this.organizationRepository.find(id);
  }

  public async listByMember(email: string): Promise<Array<IOrganization>> {
    return this.organizationRepository.listByMember(email);
  }

  public async create(name: string, email: string): Promise<IOrganization> {
    const now = new Date();

    for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt += 1) {
      const organization: IOrganization = {
        can_use_email_connection: false,
        created_at: now,
        created_by: email,
        id: `${ORGANIZATION_ID_PREFIX}${randomBytes(6).toString('hex')}`,
        members: [{ email, role: 'admin' }],
        name,
        slug: this.buildSlug(name, attempt),
        updated_at: now,
      };

      try {
        await this.organizationRepository.insert(organization);

        return organization;
      } catch (error: any) {
        if (error?.code !== 11000 || attempt === SLUG_ATTEMPTS - 1) {
          throw error;
        }
      }
    }

    throw new Error('Could not allocate an organization slug');
  }

  public async addMember(
    organization: IOrganization,
    email: string,
    role: IOrganizationRole,
    actor: string,
  ): Promise<IOrganization> {
    this.assertAdmin(organization, actor);

    const added = await this.organizationRepository.addMember(organization.id, {
      email,
      role,
    });

    if (!added) {
      await this.organizationRepository.setMemberRole(
        organization.id,
        email,
        role,
      );
    }

    return this.reload(organization.id);
  }

  public async removeMember(
    organization: IOrganization,
    email: string,
    actor: string,
  ): Promise<IOrganization> {
    this.assertAdmin(organization, actor);

    const remaining = organization.members.filter(
      (member) => member.email !== email,
    );

    if (!remaining.some((member) => member.role === 'admin')) {
      throw HttpError.forbidden();
    }

    await this.organizationRepository.removeMember(organization.id, email);

    return this.reload(organization.id);
  }

  public findMember(
    organization: IOrganization,
    email: string,
  ): IOrganizationMember | null {
    return (
      organization.members.find((member) => member.email === email) ?? null
    );
  }

  public assertAdmin(organization: IOrganization, email: string): void {
    if (this.findMember(organization, email)?.role !== 'admin') {
      throw HttpError.forbidden();
    }
  }

  private async reload(id: string): Promise<IOrganization> {
    const organization = await this.organizationRepository.find(id);

    if (!organization) {
      throw new Error(`Organization ${id} disappeared during a write`);
    }

    return organization;
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
