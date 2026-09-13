import type { OAuthAccountRepository } from '../repositories';
import type { IOAuthAccount } from '../types';
import type { OrganizationService } from './organization.service';
import { OAuthAccountService } from './oauth-account.service';

describe('OAuthAccountService', () => {
  it('reconnects by stable GitHub subject when the verified email changes', async () => {
    const existing: IOAuthAccount = {
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      email_address: 'old@example.com',
      id: 'account-1',
      organization_id: 'organization-1',
      provider: 'github',
      subject: '12345',
      updated_at: new Date('2026-01-01T00:00:00.000Z'),
    };
    const oauthAccountRepository = {
      findByProviderAndSubject: jest.fn(() => Promise.resolve(existing)),
      setEmailAddress: jest.fn(() => Promise.resolve()),
    } as unknown as OAuthAccountRepository;
    const organizationService = {
      ensurePersonalWorkspace: jest.fn(),
    } as unknown as OrganizationService;
    const service = new OAuthAccountService(
      oauthAccountRepository,
      organizationService,
    );

    const account = await service.connectGitHub({
      email_address: 'new@example.com',
      subject: '12345',
    });

    expect(account.id).toBe('account-1');
    expect(account.organization_id).toBe('organization-1');
    expect(account.email_address).toBe('new@example.com');
    expect(oauthAccountRepository.setEmailAddress).toHaveBeenCalledWith(
      'account-1',
      'new@example.com',
    );
    expect(organizationService.ensurePersonalWorkspace).not.toHaveBeenCalled();
  });
});
