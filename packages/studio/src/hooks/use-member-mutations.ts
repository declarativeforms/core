import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import type { ApiOrganization, ApiOrganizationRole } from '@/lib/api.types';
import { memberPath, membersPath } from '@/lib/api-paths';
import { sessionQueryKey } from '@/lib/query-keys';

export type SaveMemberInput = {
  email: string;
  role: ApiOrganizationRole;
};

export function useSaveMember(
  organizationId: string,
): UseMutationResult<ApiOrganization, Error, SaveMemberInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveMemberInput) =>
      apiRequest<ApiOrganization>({
        body: { email: input.email, role: input.role },
        method: 'POST',
        path: membersPath(organizationId),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionQueryKey() });
    },
  });
}

export function useRemoveMember(
  organizationId: string,
): UseMutationResult<ApiOrganization, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) =>
      apiRequest<ApiOrganization>({
        method: 'DELETE',
        path: memberPath(organizationId, email),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionQueryKey() });
    },
  });
}
