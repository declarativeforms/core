import { useQuery } from '@tanstack/react-query';
import { apiPublicRequest } from '@/lib/api-client';
import type { ApiRuntimeConfig } from '@/lib/api.types';
import { configQueryKey } from '@/lib/query-keys';

export function useRuntimeConfig(): string | null {
  const query = useQuery({
    queryFn: () =>
      apiPublicRequest<ApiRuntimeConfig>({ method: 'GET', path: 'config' }),
    queryKey: configQueryKey(),
    staleTime: Number.POSITIVE_INFINITY,
  });

  return query.data?.form_base_url || null;
}
