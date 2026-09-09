import type { ApiOrganization, ApiOrganizationRole } from '@/lib/api.types';

export function useRole(
  organization: ApiOrganization | null,
  email: string | null,
): ApiOrganizationRole | null {
  if (!organization || !email) {
    return null;
  }

  const member = organization.members.find((entry) => entry.email === email);

  return member ? member.role : null;
}
