import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router';
import { watchAuthStorage } from '@/lib/auth-store';
import { useSession } from '@/hooks/use-session';
import { restoreSelectionPath } from '@/hooks/use-selection';
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

  return (
    <Routes>
      <Route
        element={
          <Workspace
            email={session.email ?? ''}
            onSignOut={session.signOut}
            organizations={session.organizations}
          />
        }
        path="/"
      />
      <Route
        element={
          <Workspace
            email={session.email ?? ''}
            onSignOut={session.signOut}
            organizations={session.organizations}
          />
        }
        path="/forms/:formId"
      />
      <Route
        element={
          <Workspace
            email={session.email ?? ''}
            onSignOut={session.signOut}
            organizations={session.organizations}
          />
        }
        path="*"
      />
    </Routes>
  );
}

export function App() {
  const [queryClient] = useState(buildQueryClient);

  useEffect(() => {
    watchAuthStorage();
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
