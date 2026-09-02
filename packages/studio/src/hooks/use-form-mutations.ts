import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import type { ApiBranchWrite, ApiForm } from '@/lib/api.types';
import {
  branchPath,
  branchesPath,
  formPath,
  publishPath,
} from '@/lib/api-paths';
import {
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
): UseMutationResult<ApiForm, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      apiRequest<ApiForm>({
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
): UseMutationResult<ApiBranchWrite, Error, CreateBranchInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBranchInput) =>
      apiRequest<ApiBranchWrite>({
        body: { from: input.from, name: input.name },
        method: 'POST',
        path: branchesPath(organizationId, formId),
      }),
    onSuccess: (write: ApiBranchWrite) => {
      void queryClient.invalidateQueries({
        queryKey: branchesQueryKey(organizationId, formId),
      });
      void queryClient.invalidateQueries({
        queryKey: formsQueryKey(organizationId),
      });
      void queryClient.invalidateQueries({
        queryKey: messagesQueryKey(organizationId, formId, write.branch),
      });
    },
  });
}

export function usePublishBranch(
  organizationId: string,
  formId: string,
): UseMutationResult<ApiBranchWrite, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (branch: string) =>
      apiRequest<ApiBranchWrite>({
        body: { delete_branch: false },
        method: 'POST',
        path: publishPath(organizationId, formId, branch),
      }),
    onSuccess: (write: ApiBranchWrite, branch: string) => {
      void queryClient.invalidateQueries({
        queryKey: branchesQueryKey(organizationId, formId),
      });
      void queryClient.invalidateQueries({
        queryKey: formsQueryKey(organizationId),
      });
      void queryClient.invalidateQueries({
        queryKey: messagesQueryKey(organizationId, formId, write.branch),
      });
      void queryClient.invalidateQueries({
        queryKey: messagesQueryKey(organizationId, formId, branch),
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
