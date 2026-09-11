import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import {
  branchPath,
  branchesPath,
  formPath,
  publishPath,
} from '@/lib/api-paths';
import {
  branchYamlQueryKey,
  branchesQueryKey,
  formsQueryKey,
  messagesQueryKey,
} from '@/lib/query-keys';

export type CreateBranchInput = {
  name: string;
  from: string;
};

export function useRenameForm(
  organizationId: string,
  formId: string,
): UseMutationResult<unknown, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      apiRequest<unknown>({
        body: { name },
        method: 'PATCH',
        path: formPath(organizationId, formId),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: formsQueryKey(organizationId),
      });
    },
  });
}

export function useDeleteForm(
  organizationId: string,
  formId: string,
): UseMutationResult<unknown, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequest<unknown>({
        method: 'DELETE',
        path: formPath(organizationId, formId),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: formsQueryKey(organizationId),
      });
    },
  });
}

export function useCreateBranch(
  organizationId: string,
  formId: string,
): UseMutationResult<unknown, Error, CreateBranchInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBranchInput) =>
      apiRequest<unknown>({
        body: { from: input.from, name: input.name },
        method: 'POST',
        path: branchesPath(organizationId, formId),
      }),
    onSuccess: (result: unknown, input: CreateBranchInput) => {
      void result;

      void queryClient.invalidateQueries({
        queryKey: branchYamlQueryKey(organizationId, formId, input.name),
      });
      void queryClient.invalidateQueries({
        queryKey: messagesQueryKey(organizationId, formId, input.name),
      });

      return queryClient.invalidateQueries({
        queryKey: branchesQueryKey(organizationId, formId),
      });
    },
  });
}

export function usePublishBranch(
  organizationId: string,
  formId: string,
): UseMutationResult<unknown, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (branch: string) =>
      apiRequest<unknown>({
        method: 'POST',
        path: publishPath(organizationId, formId, branch),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: branchYamlQueryKey(organizationId, formId, 'main'),
      });
      void queryClient.invalidateQueries({
        queryKey: formsQueryKey(organizationId),
      });
    },
  });
}

export function useDeleteBranch(
  organizationId: string,
  formId: string,
): UseMutationResult<unknown, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (branch: string) =>
      apiRequest<unknown>({
        method: 'DELETE',
        path: branchPath(organizationId, formId, branch),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: branchesQueryKey(organizationId, formId),
      });
      void queryClient.invalidateQueries({
        queryKey: formsQueryKey(organizationId),
      });
    },
  });
}
