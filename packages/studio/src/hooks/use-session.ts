import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { apiRequest } from '@/lib/api-client';
import type { ApiOrganization, ApiSession } from '@/lib/api.types';
import {
  exchangeAuthCode,
  readAuthCode,
  startGithubAuthorization,
  stripAuthCode,
} from '@/lib/auth-flow';
import {
  canReauthorize,
  clearAccessToken,
  markReauthorized,
  readAuth,
  setAccessToken,
  subscribeAuth,
} from '@/lib/auth-store';
import { clearDrafts } from '@/lib/draft-store';
import { describeError } from '@/lib/error-messages';
import { clearPersistedSelection } from '@/lib/selection-store';
import { sessionQueryKey } from '@/lib/query-keys';

export type SessionStatus =
  'authenticating' | 'loading' | 'signed-in' | 'signed-out';

export type Session = {
  status: SessionStatus;
  email: string | null;
  organizations: Array<ApiOrganization>;
  errorMessage: string | null;
  signIn: () => void;
  signOut: () => void;
  retry: () => void;
};

export function useSession(): Session {
  const auth = useSyncExternalStore(subscribeAuth, readAuth);
  const queryClient = useQueryClient();
  const [isExchanging, setIsExchanging] = useState(readAuthCode() !== null);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const hasExchanged = useRef(false);

  useEffect(() => {
    const code = readAuthCode();

    if (!code || hasExchanged.current) {
      return;
    }

    hasExchanged.current = true;
    stripAuthCode();
    setIsExchanging(true);

    exchangeAuthCode(code)
      .then((token) => {
        setAccessToken(token.access_token, token.expires_in);
        setExchangeError(null);
      })
      .catch((error: unknown) => {
        setExchangeError(describeError(error));
      })
      .finally(() => {
        setIsExchanging(false);
      });
  }, []);

  const sessionQuery = useQuery({
    enabled: auth.accessToken !== null,
    queryFn: () => apiRequest<ApiSession>({ method: 'GET', path: 'auth/me' }),
    queryKey: sessionQueryKey(),
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  useEffect(() => {
    if (auth.accessToken !== null || auth.reason !== 'expired') {
      return;
    }

    if (!canReauthorize()) {
      return;
    }

    markReauthorized();
    startGithubAuthorization();
  }, [auth.accessToken, auth.reason]);

  const handleSignOut = (): void => {
    clearAccessToken('signed-out');
    clearPersistedSelection();
    clearDrafts();
    queryClient.clear();
  };

  const status = readStatus(
    isExchanging,
    auth.accessToken,
    sessionQuery.isPending,
    sessionQuery.isError,
  );

  return {
    email: sessionQuery.data?.email ?? null,
    errorMessage:
      exchangeError ??
      (sessionQuery.isError ? describeError(sessionQuery.error) : null),
    organizations: sessionQuery.data?.organizations ?? [],
    retry: () => {
      setExchangeError(null);
      void sessionQuery.refetch();
    },
    signIn: startGithubAuthorization,
    signOut: handleSignOut,
    status,
  };
}

function readStatus(
  isExchanging: boolean,
  accessToken: string | null,
  isPending: boolean,
  isError: boolean,
): SessionStatus {
  if (isExchanging) {
    return 'authenticating';
  }

  if (accessToken === null) {
    return 'signed-out';
  }

  if (isError) {
    return 'signed-out';
  }

  if (isPending) {
    return 'loading';
  }

  return 'signed-in';
}
