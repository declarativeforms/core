import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import type { ApiBranchYaml } from '@/lib/api.types';
import { branchYamlPath } from '@/lib/api-paths';
import { branchYamlQueryKey } from '@/lib/query-keys';

export function useBranchYaml(
  organizationId: string,
  formId: string,
  branch: string,
  revision: number,
  isEnabled: boolean,
): UseQueryResult<ApiBranchYaml, Error> {
  return useQuery({
    enabled: isEnabled,
    queryFn: () =>
      apiRequest<ApiBranchYaml>({
        method: 'GET',
        path: branchYamlPath(organizationId, formId, branch),
      }),
    queryKey: branchYamlQueryKey(organizationId, formId, branch, revision),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
