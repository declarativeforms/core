import { randomUUID } from 'node:crypto';
import type { OAuthAccountRepository } from '../repositories';
import type { IOAuthAccount, IOAuthUser } from '../types';
import type { OrganizationService } from './organization.service';

export class OAuthAccountService {
  constructor(
    private oauthAccountRepository: OAuthAccountRepository,
    private organizationService: OrganizationService,
  ) {}

  public find(id: string): Promise<IOAuthAccount | null> {
    return this.oauthAccountRepository.findById(id);
  }

  public async connectGitHub(user: IOAuthUser): Promise<IOAuthAccount> {
    const existing = await this.oauthAccountRepository.findByProviderAndSubject(
      'github',
      user.subject,
    );

    if (existing) {
      if (existing.email_address !== user.email_address) {
        await this.oauthAccountRepository.setEmailAddress(
          existing.id,
          user.email_address,
        );
      }

      return {
        ...existing,
        email_address: user.email_address,
        updated_at:
          existing.email_address === user.email_address
            ? existing.updated_at
            : new Date(),
      };
    }

    const organization = await this.organizationService.ensurePersonalWorkspace(
      user.email_address,
    );
    const now = new Date();
    const account: IOAuthAccount = {
      created_at: now,
      email_address: user.email_address,
      id: randomUUID(),
      organization_id: organization.id,
      provider: 'github',
      subject: user.subject,
      updated_at: now,
    };

    try {
      await this.oauthAccountRepository.insert(account);

      return account;
    } catch (error: any) {
      if (error?.code !== 11000) {
        throw error;
      }

      const concurrent =
        await this.oauthAccountRepository.findByProviderAndSubject(
          'github',
          user.subject,
        );

      if (!concurrent) {
        throw error;
      }

      return concurrent;
    }
  }
}
