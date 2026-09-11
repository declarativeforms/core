import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import type { ApiMessage } from '@/lib/api.types';
import { generatePath } from '@/lib/api-paths';
import {
  branchYamlQueryKey,
  formsQueryKey,
  messagesQueryKey,
} from '@/lib/query-keys';

const GENERATION_TIMEOUT_MS = 120_000;

export function useSendMessage(
  organizationId: string,
  formId: string,
  branch: string,
): UseMutationResult<Array<ApiMessage>, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prompt: string) =>
      apiRequest<Array<ApiMessage>>({
        body: { branch, form_id: formId, prompt },
        method: 'POST',
        path: generatePath(organizationId),
        timeoutMs: GENERATION_TIMEOUT_MS,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: messagesQueryKey(organizationId, formId, branch),
      });
      void queryClient.invalidateQueries({
        queryKey: branchYamlQueryKey(organizationId, formId, branch),
      });
      void queryClient.invalidateQueries({
        queryKey: formsQueryKey(organizationId),
      });
    },
  });
}
