import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import type { ApiForm } from '@/lib/api.types';
import { formsPath } from '@/lib/api-paths';
import { formsQueryKey } from '@/lib/query-keys';

export function useForms(
  organizationId: string | null,
): UseQueryResult<Array<ApiForm>, Error> {
  return useQuery({
    enabled: organizationId !== null,
    queryFn: () =>
      apiRequest<Array<ApiForm>>({
        method: 'GET',
        path: formsPath(organizationId as string),
      }),
    queryKey: formsQueryKey(organizationId ?? 'none'),
  });
}
