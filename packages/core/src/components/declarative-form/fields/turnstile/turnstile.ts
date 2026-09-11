'use client';

type TurnstileOptions = {
  sitekey: string;
  language: string;
  'response-field': false;
  retry: 'never';
  callback: (response: string) => void;
  'error-callback': () => void;
  'expired-callback': () => void;
  'timeout-callback': () => void;
};

type Turnstile = {
  ready: (callback: () => void) => void;
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  remove: (widgetId: string) => void;
};

let loading: Promise<Turnstile> | undefined;

export function loadTurnstile(): Promise<Turnstile> {
  if (loading) {
    return loading;
  }

  loading = new Promise<Turnstile>((resolve, reject): void => {
    const runtime = window as Window & { turnstile?: Turnstile };
    const script = document.createElement('script');
    const timeout = window.setTimeout(rejectLoading, 15000);
    let settled = false;

    function rejectLoading(): void {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error('Could not load verification'));
    }

    function resolveWhenReady(): void {
      if (!runtime.turnstile) {
        rejectLoading();

        return;
      }

      runtime.turnstile.ready((): void => {
        if (settled || !runtime.turnstile) {
          return;
        }

        settled = true;
        window.clearTimeout(timeout);
        resolve(runtime.turnstile);
      });
    }

    if (runtime.turnstile) {
      resolveWhenReady();

      return;
    }

    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = resolveWhenReady;
    script.onerror = rejectLoading;
    document.head.appendChild(script);
  }).catch((error: unknown): never => {
    loading = undefined;
    throw error;
  });

  return loading;
}
