import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import type { ApiMessage } from '@/lib/api.types';
import { messagesPath } from '@/lib/api-paths';
import { describeError } from '@/lib/error-messages';
import { messagesQueryKey } from '@/lib/query-keys';

export type MessageHistory = {
  messages: Array<ApiMessage>;
  isLoading: boolean;
  errorMessage: string | null;
  retry: () => void;
};

export function useMessages(
  organizationId: string | null,
  formId: string | null,
  branch: string,
): MessageHistory {
  const query = useQuery({
    enabled: organizationId !== null && formId !== null,
    queryFn: () =>
      apiRequest<Array<ApiMessage>>({
        method: 'GET',
        path: messagesPath(organizationId as string, formId as string, branch),
      }),
    queryKey: messagesQueryKey(
      organizationId ?? 'none',
      formId ?? 'none',
      branch,
    ),
  });

  return {
    errorMessage: query.isError ? describeError(query.error) : null,
    isLoading: query.isPending,
    messages: query.data ?? [],
    retry: () => {
      void query.refetch();
    },
  };
}
