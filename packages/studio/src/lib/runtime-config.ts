declare global {
  interface Window {
    __CONFIG__?: {
      posthogApiHost?: string;
      posthogProjectKey?: string;
    };
  }
}

export type RuntimeConfig = {
  posthogApiHost: string;
  posthogProjectKey: string;
};

export function runtimeConfig(): RuntimeConfig {
  return {
    posthogApiHost:
      window.__CONFIG__?.posthogApiHost ??
      import.meta.env.VITE_POSTHOG_API_HOST ??
      '',
    posthogProjectKey:
      window.__CONFIG__?.posthogProjectKey ??
      import.meta.env.VITE_POSTHOG_PROJECT_KEY ??
      '',
  };
}
