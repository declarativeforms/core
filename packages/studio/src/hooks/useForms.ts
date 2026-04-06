import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getBackendUrl } from "@/lib/api";
import { getAuthHeaders } from "@/lib/auth";
import type { IDeclarativeForm, ISubmission } from "@declarativeforms/types";

export const studioFormsKeys = {
  all: ["studio", "forms"] as const,
  detail: (id: string) => ["studio", "forms", id] as const,
  submissions: (id: string) => ["studio", "forms", id, "submissions"] as const,
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function useForms() {
  return useQuery({
    queryKey: studioFormsKeys.all,
    queryFn: async () => {
      const response = await fetch(getBackendUrl("studio/forms"), {
        headers: getAuthHeaders(),
      });
      return parseJsonResponse<IDeclarativeForm[]>(response);
    },
  });
}

export function useForm(id: string) {
  return useQuery({
    queryKey: studioFormsKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(getBackendUrl(`studio/forms/${id}`), {
        headers: getAuthHeaders(),
      });
      return parseJsonResponse<IDeclarativeForm>(response);
    },
    enabled: Boolean(id) && id !== "new",
  });
}

export function useCreateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: IDeclarativeForm) => {
      const response = await fetch(getBackendUrl("studio/forms"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(form),
      });

      return parseJsonResponse<IDeclarativeForm>(response);
    },
    onSuccess: (form) => {
      if (!form.id) {
        return;
      }

      queryClient.setQueryData(studioFormsKeys.detail(form.id), form);
      void queryClient.invalidateQueries({ queryKey: studioFormsKeys.all });
    },
  });
}

export function useUpdateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; form: IDeclarativeForm }) => {
      const response = await fetch(getBackendUrl(`studio/forms/${input.id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(input.form),
      });

      return parseJsonResponse<IDeclarativeForm>(response);
    },
    onSuccess: (form, input) => {
      queryClient.setQueryData(studioFormsKeys.detail(input.id), form);
      void queryClient.invalidateQueries({ queryKey: studioFormsKeys.all });
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(getBackendUrl(`studio/forms/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      await parseJsonResponse<void>(response);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: studioFormsKeys.detail(id) });
      queryClient.removeQueries({ queryKey: studioFormsKeys.submissions(id) });
      void queryClient.invalidateQueries({ queryKey: studioFormsKeys.all });
    },
  });
}

export function useSubmissions(formId: string) {
  return useQuery({
    queryKey: studioFormsKeys.submissions(formId),
    queryFn: async () => {
      const response = await fetch(
        getBackendUrl(`studio/forms/${formId}/submissions`),
        { headers: getAuthHeaders() },
      );

      return parseJsonResponse<ISubmission[]>(response);
    },
    enabled: Boolean(formId) && formId !== "new",
  });
}
