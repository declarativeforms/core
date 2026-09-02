import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import type { ApiMessageTurn } from '@/lib/api.types';
import { messagesPath } from '@/lib/api-paths';
import { formsQueryKey, messagesQueryKey } from '@/lib/query-keys';

const GENERATION_TIMEOUT_MS = 120_000;

export type SendMessageInput = {
  content: string;
  idempotencyKey: string;
};

export function useSendMessage(
  organizationId: string,
  formId: string,
  branch: string,
): UseMutationResult<ApiMessageTurn, Error, SendMessageInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMessageInput) =>
      apiRequest<ApiMessageTurn>({
        body: { content: input.content, idempotency_key: input.idempotencyKey },
        method: 'POST',
        path: messagesPath(organizationId, formId, branch),
        timeoutMs: GENERATION_TIMEOUT_MS,
      }),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: messagesQueryKey(organizationId, formId, branch),
      });
      void queryClient.invalidateQueries({
        queryKey: formsQueryKey(organizationId),
      });
    },
  });
}
