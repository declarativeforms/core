import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { branchesPath } from '@/lib/api-paths';
import { branchesQueryKey } from '@/lib/query-keys';

export function useBranches(
  organizationId: string | null,
  formId: string | null,
): UseQueryResult<Array<string>, Error> {
  return useQuery({
    enabled: organizationId !== null && formId !== null,
    queryFn: () =>
      apiRequest<Array<string>>({
        method: 'GET',
        path: branchesPath(organizationId as string, formId as string),
      }),
    queryKey: branchesQueryKey(organizationId ?? 'none', formId ?? 'none'),
  });
}
