import { useInfiniteQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import type { ApiMessage, ApiMessagePage } from '@/lib/api.types';
import { messagesPath, messagesPageQuery } from '@/lib/api-paths';
import { describeError } from '@/lib/error-messages';
import { messagesQueryKey } from '@/lib/query-keys';

const PAGE_SIZE = 50;

export type MessageHistory = {
  messages: Array<ApiMessage>;
  isLoading: boolean;
  isStale: boolean;
  hasOlder: boolean;
  isLoadingOlder: boolean;
  errorMessage: string | null;
  loadOlder: () => void;
  retry: () => void;
};

export function useMessages(
  organizationId: string | null,
  formId: string | null,
  branch: string,
): MessageHistory {
  const query = useInfiniteQuery({
    enabled: organizationId !== null && formId !== null,
    getNextPageParam: (lastPage: ApiMessagePage) => lastPage.next_cursor,
    initialPageParam: null as string | null,
    queryFn: (context) =>
      apiRequest<ApiMessagePage>({
        method: 'GET',
        path: `${messagesPath(
          organizationId as string,
          formId as string,
          branch,
        )}?${messagesPageQuery(PAGE_SIZE, context.pageParam)}`,
      }),
    queryKey: messagesQueryKey(
      organizationId ?? 'none',
      formId ?? 'none',
      branch,
    ),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  const unique = new Map<string, ApiMessage>();

  for (const page of query.data?.pages ?? []) {
    for (const message of page.messages) {
      unique.set(message.id, message);
    }
  }

  const messages = Array.from(unique.values()).sort(
    (left, right) => left.sequence - right.sequence,
  );

  return {
    errorMessage:
      query.isError && messages.length === 0
        ? describeError(query.error)
        : null,
    hasOlder: query.hasNextPage,
    isLoading: query.isPending,
    isLoadingOlder: query.isFetchingNextPage,
    isStale: query.isError && messages.length > 0,
    loadOlder: () => {
      void query.fetchNextPage();
    },
    messages,
    retry: () => {
      void query.refetch();
    },
  };
}
