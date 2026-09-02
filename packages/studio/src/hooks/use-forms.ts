import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import type { ApiFormSummary } from '@/lib/api.types';
import { formsPath } from '@/lib/api-paths';
import { formsQueryKey } from '@/lib/query-keys';

export function useForms(
  organizationId: string | null,
): UseQueryResult<Array<ApiFormSummary>, Error> {
  return useQuery({
    enabled: organizationId !== null,
    queryFn: () =>
      apiRequest<Array<ApiFormSummary>>({
        method: 'GET',
        path: formsPath(organizationId as string),
      }),
    queryKey: formsQueryKey(organizationId ?? 'none'),
  });
}
