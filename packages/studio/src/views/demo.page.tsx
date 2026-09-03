import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, ErrorState } from '@/components';
import { exchangeDemoSession } from '@/lib/auth-flow';
import { setAccessToken } from '@/lib/auth-store';
import { describeError } from '@/lib/error-messages';
import { Authenticating } from './authenticating.page';

export function Demo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [attempt, setAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    exchangeDemoSession()
      .then((token) => {
        if (!isActive) {
          return;
        }

        queryClient.clear();
        setAccessToken(token.access_token, token.expires_in);
        void navigate('/', { replace: true });
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setErrorMessage(describeError(error));
      });

    return () => {
      isActive = false;
    };
  }, [attempt, navigate, queryClient]);

  if (errorMessage) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <div className="flex w-full max-w-md flex-col gap-4">
          <ErrorState message={errorMessage} />
          <Button
            onClick={() => {
              setErrorMessage(null);
              setAttempt((value) => value + 1);
            }}
          >
            Retry
          </Button>
        </div>
      </main>
    );
  }

  return <Authenticating label="Loading the demo workspace…" />;
}
