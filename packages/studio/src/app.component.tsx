import { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router';
import { watchAuthStorage } from '@/lib/auth-store';
import {
  initializeWebAnalytics,
  syncWebAnalyticsIdentity,
} from '@/lib/web-analytics';
import { useSession } from '@/hooks/use-session';
import { restoreSelectionPath } from '@/lib/selection-store';
import { Authenticating } from '@/views/authenticating.page';
import { Demo } from '@/views/demo.page';
import { SignedOut } from '@/views/signed-out.page';
import { Workspace } from '@/views/workspace.page';

function buildQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: 0 },
      queries: { gcTime: 300_000, retry: 1, staleTime: 30_000 },
    },
  });
}

function SessionGate() {
  const session = useSession();
  const navigate = useNavigate();
  const hasRestored = useRef(false);

  useEffect(() => {
    if (session.status !== 'signed-in' || hasRestored.current) {
      return;
    }

    hasRestored.current = true;

    if (window.location.pathname !== '/') {
      return;
    }

    const path = restoreSelectionPath();

    if (path) {
      void navigate(path, { replace: true });
    }
  }, [navigate, session.status]);

  useEffect(() => {
    if (session.status === 'signed-in') {
      syncWebAnalyticsIdentity(session.email);

      return;
    }

    if (session.status === 'signed-out') {
      syncWebAnalyticsIdentity(null);
    }
  }, [session.email, session.status]);

  if (session.status === 'authenticating') {
    return <Authenticating label="Completing sign-in…" />;
  }

  if (session.status === 'loading') {
    return <Authenticating label="Loading your workspace…" />;
  }

  if (session.status === 'signed-out') {
    return (
      <SignedOut
        errorMessage={session.errorMessage}
        onSignIn={session.signIn}
      />
    );
  }

  const workspace = (
    <Workspace
      email={session.email ?? ''}
      onRefreshSession={session.retry}
      onSignOut={session.signOut}
      organizations={session.organizations}
    />
  );

  return (
    <Routes>
      <Route element={workspace} path="/" />
      <Route element={workspace} path="/forms/:formId" />
      <Route element={workspace} path="*" />
    </Routes>
  );
}

export function App() {
  const [queryClient] = useState(buildQueryClient);

  useEffect(() => {
    watchAuthStorage();
    initializeWebAnalytics();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Demo />} path="/demo" />
          <Route element={<SessionGate />} path="*" />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
