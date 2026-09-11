import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import type { ApiOrganizationRole } from '@/lib/api.types';
import { memberPath, membersPath } from '@/lib/api-paths';
import { sessionQueryKey } from '@/lib/query-keys';

export type SaveMemberInput = {
  email: string;
  role: ApiOrganizationRole;
};

export function useSaveMember(
  organizationId: string,
): UseMutationResult<unknown, Error, SaveMemberInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveMemberInput) =>
      apiRequest<unknown>({
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
): UseMutationResult<unknown, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) =>
      apiRequest<unknown>({
        method: 'DELETE',
        path: memberPath(organizationId, email),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionQueryKey() });
    },
  });
}
