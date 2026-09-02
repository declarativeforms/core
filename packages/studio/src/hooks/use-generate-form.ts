import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import type { ApiMessagePage, ApiMessageTurn } from '@/lib/api.types';
import { generatePath } from '@/lib/api-paths';
import { formsQueryKey, messagesQueryKey } from '@/lib/query-keys';

const GENERATION_TIMEOUT_MS = 120_000;

export function useGenerateForm(
  organizationId: string,
): UseMutationResult<ApiMessageTurn, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prompt: string) =>
      apiRequest<ApiMessageTurn>({
        body: { prompt },
        method: 'POST',
        path: generatePath(organizationId),
        timeoutMs: GENERATION_TIMEOUT_MS,
      }),
    onSuccess: (turn: ApiMessageTurn) => {
      const page: ApiMessagePage = {
        messages: [turn.assistant_message, turn.user_message],
        next_cursor: null,
      };
      queryClient.setQueryData(
        messagesQueryKey(organizationId, turn.summary.form_id, turn.branch),
        { pageParams: [null], pages: [page] },
      );
      void queryClient.invalidateQueries({
        queryKey: formsQueryKey(organizationId),
      });
    },
  });
}
