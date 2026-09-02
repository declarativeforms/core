import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import type { ApiMessage, ApiMessagePage } from '@/lib/api.types';
import { generatePath } from '@/lib/api-paths';
import { formsQueryKey, messagesQueryKey } from '@/lib/query-keys';

const GENERATION_TIMEOUT_MS = 120_000;

export function useGenerateForm(
  organizationId: string,
): UseMutationResult<Array<ApiMessage>, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prompt: string) =>
      apiRequest<Array<ApiMessage>>({
        body: { prompt },
        method: 'POST',
        path: generatePath(organizationId),
        timeoutMs: GENERATION_TIMEOUT_MS,
      }),
    onSuccess: (messages: Array<ApiMessage>) => {
      const created = messages[0];

      if (!created) {
        return;
      }

      const page: ApiMessagePage = {
        messages: messages.slice().reverse(),
        next_cursor: null,
      };
      queryClient.setQueryData(
        messagesQueryKey(organizationId, created.form_id, created.branch),
        { pageParams: [null], pages: [page] },
      );
      void queryClient.invalidateQueries({
        queryKey: formsQueryKey(organizationId),
      });
    },
  });
}
